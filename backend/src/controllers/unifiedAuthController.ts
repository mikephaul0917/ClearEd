import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Institution from "../models/Institution";
import OrganizationMember from "../models/OrganizationMember";
import AccessRequest from "../models/AccessRequest";
import Notification from "../models/Notification";
import StudentProfile from "../models/StudentProfile";
import { logAudit } from "../utils/auditLogger";
import crypto from "crypto";

// Rate limiting store (in production, use Redis)
const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();

// Unified Login/Registration Flow (Google Classroom-style)
export const unifiedLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip || 'unknown';

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // 1. Domain Extraction
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (!emailDomain) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // 2. Institution Resolution & Validation
    const institution = await Institution.findOne({ domain: emailDomain });

    // Note: Super Admins may not have a domain match if they use a personal/system email
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    // 3. Super Admin Specialized Flow
    if (existingUser && existingUser.role === 'super_admin') {
      const valid = await bcrypt.compare(password, existingUser.password);
      if (!valid) return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign(
        {
          id: existingUser._id,
          role: existingUser.role,
          email: existingUser.email,
          isAdmin: true,
          isStudent: false // Super admins are never students
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        user: {
          id: existingUser._id,
          email: existingUser.email,
          fullName: existingUser.fullName,
          avatarUrl: existingUser.avatarUrl,
          role: existingUser.role,
          institutionId: null,
          isNewUser: false
        }
      });
    }

    // 4. Institutional User Flow
    if (!institution) {
      await logAudit({
        action: 'INSTITUTION_NOT_FOUND',
        category: 'auth',
        resource: 'Institution',
        details: { email, domain: emailDomain },
        severity: 'medium',
        req
      });
      return res.status(403).json({
        message: "Your institution is not registered. Please contact your administrator."
      });
    }

    if (institution.status !== 'approved') {
      return res.status(403).json({
        message: `Institution status is ${institution.status}. Access denied.`
      });
    }

    if (existingUser) {
      // 5. Existing Institutional User Auth
      if (existingUser.institutionId?.toString() !== institution._id.toString()) {
        return res.status(403).json({ message: "Email domain mismatch for this institution." });
      }

      if (!existingUser.enabled || existingUser.status === 'locked') {
        return res.status(403).json({ message: "Account is active but locked or disabled." });
      }

      const valid = await bcrypt.compare(password, existingUser.password);
      if (!valid) {
        await logAudit({
          userId: existingUser._id,
          institutionId: institution._id,
          action: 'LOGIN_FAILED',
          category: 'auth',
          resource: 'User',
          resourceId: existingUser._id,
          details: { email, reason: 'Invalid password' },
          severity: 'high',
          req
        });
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign(
        {
          id: existingUser._id,
          role: existingUser.role,
          email: existingUser.email,
          institutionId: existingUser.institutionId,
          isAdmin: existingUser.role === 'admin',
          isStudent: existingUser.role === 'student' || (await StudentProfile.exists({ userId: existingUser._id }))
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '24h' }
      );

      // Update last login
      existingUser.lastLoginAt = new Date();
      await existingUser.save();

      await logAudit({
        userId: existingUser._id,
        institutionId: institution._id,
        action: 'LOGIN_SUCCESS',
        category: 'auth',
        resource: 'User',
        resourceId: existingUser._id,
        severity: 'low',
        req
      });

      return res.json({
        token,
        user: {
          id: existingUser._id,
          email: existingUser.email,
          fullName: existingUser.fullName,
          avatarUrl: existingUser.avatarUrl,
          role: existingUser.role,
          institutionId: existingUser.institutionId,
          isStudent: existingUser.role === 'student' || (await StudentProfile.exists({ userId: existingUser._id })),
          isNewUser: false
        }
      });

    } else {
      // 6. First-time Student Registration (Explicitly requested)
      if (!req.body.isRegister) {
        await logAudit({
          institutionId: institution._id,
          action: 'LOGIN_FAILED',
          category: 'auth',
          resource: 'User',
          details: { email, reason: 'User not found in institution' },
          severity: 'medium',
          req
        });
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!institution.settings?.allowStudentRegistration) {
        return res.status(403).json({ message: "Self-enrollment is disabled for your institution." });
      }

      // Model handles password hashing via pre-save hook
      const newUser = await User.create({
        email: email.toLowerCase(),
        password: password,
        fullName: email.split('@')[0],
        role: 'student',
        institutionId: institution._id,
        status: 'active',
        enabled: true,
        emailVerified: true // Auto-verified for institutional domains
      });

      const token = jwt.sign(
        {
          id: newUser._id,
          role: newUser.role,
          email: newUser.email,
          institutionId: newUser.institutionId,
          isAdmin: false,
          isStudent: true
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '24h' }
      );

      await logAudit({
        userId: newUser._id,
        institutionId: institution._id,
        action: 'USER_AUTO_ENROLLED',
        category: 'user_management',
        resource: 'User',
        resourceId: newUser._id,
        severity: 'medium',
        req
      });

      return res.json({
        token,
        user: {
          id: newUser._id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
          institutionId: newUser.institutionId,
          isStudent: true, // New self-registered users are always students
          isNewUser: true
        }
      });
    }

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Enhanced role-based user creation (for admins)
// Google OAuth authentication
export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Google OAuth token is required"
      });
    }

    // Verify Google OAuth token
    const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`);
    const googleUser = await response.json();

    if (!googleUser.email) {
      return res.status(400).json({
        message: "Invalid Google OAuth token"
      });
    }

    const email = googleUser.email.toLowerCase();
    const emailDomain = email.split('@')[1]?.toLowerCase();

    // Check if domain is personal email (not allowed)
    const personalDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
    if (personalDomains.includes(emailDomain)) {
      return res.status(403).json({
        message: "Personal email accounts are not allowed. Please use your institutional email."
      });
    }

    // Find institution by domain
    const institution = await Institution.findOne({
      domain: emailDomain
    });

    if (!institution) {
      return res.status(403).json({
        message: "Your institution is not registered with E-Clearance."
      });
    }

    // Check institution status
    if (institution.status !== 'approved') {
      let message = "";
      switch (institution.status) {
        case 'pending':
          message = "Your institution is pending approval. Please check back later.";
          break;
        case 'rejected':
          message = "Your institution's access request was rejected. Please contact your administrator.";
          break;
        case 'suspended':
          message = "Your institution's access has been suspended. Please contact your administrator.";
          break;
        default:
          message = "Your institution is not currently active.";
      }

      return res.status(403).json({ message });
    }

    // Check if user exists in this institution
    console.log(`[DEBUG] Google OAuth: Looking for user with email: ${email}, institutionId: ${institution._id}`);

    // First, try to find user by exact email match
    let user = await User.findOne({
      email: email,
      institutionId: institution._id
    });

    // If not found, try case-insensitive search
    if (!user) {
      console.log(`[DEBUG] Google OAuth: User not found with exact match, trying case-insensitive search`);
      user = await User.findOne({
        email: { $regex: new RegExp(`^${email}$`, 'i') },
        institutionId: institution._id
      });
    }

    console.log(`[DEBUG] Google OAuth: User found: ${!!user}`);
    if (user) {
      console.log(`[DEBUG] Google OAuth: Existing user details:`, { id: user._id, email: user.email, role: user.role, enabled: user.enabled, status: user.status });
    }

    if (user) {
      // Existing user - authenticate normally
      if (!user.enabled || user.status === 'locked') {
        return res.status(403).json({
          message: "Account is disabled or locked. Please contact your administrator."
        });
      }

      // Update last login and sync name/avatar from Google if they are currently generic or empty
      user.lastLoginAt = new Date();
      
      const isGenericName = !user.fullName || 
                           user.fullName.toLowerCase() === 'admin' || 
                           user.fullName.toLowerCase() === 'user' || 
                           user.fullName === user.email.split('@')[0];

      if (isGenericName && googleUser.name) {
          console.log(`[DEBUG] Google OAuth: Syncing generic name "${user.fullName}" to "${googleUser.name}"`);
          user.fullName = googleUser.name;
      }
      
      if (!user.avatarUrl && googleUser.picture) {
          console.log(`[DEBUG] Google OAuth: Syncing missing avatar to Google picture`);
          user.avatarUrl = googleUser.picture;
      }

      await user.save();

      // Log successful login
      await logAudit({
        userId: user._id,
        institutionId: institution._id,
        action: 'GOOGLE_LOGIN_SUCCESS',
        category: 'auth',
        resource: 'Authentication',
        resourceId: user._id,
        details: { email, method: 'google_oauth' },
        severity: 'low',
        req
      });

      // Create JWT token
      const jwtToken = jwt.sign(
        {
          id: user._id,
          role: user.role,
          institutionId: user.institutionId,
          email: user.email,
          isAdmin: user.role === 'admin',
          isStudent: user.role === 'student' || (await StudentProfile.exists({ userId: user._id }))
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '24h' }
      );

      return res.json({
        token: jwtToken,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          role: user.role,
          institutionId: user.institutionId,
          lastLoginAt: user.lastLoginAt,
          isStudent: user.role === 'student' || (await StudentProfile.exists({ userId: user._id })),
          isNewUser: false,
          requiresPasswordSetup: user.requiresPasswordSetup || false
        }
      });
    } else {
      // User not found — create an access request for the admin
      const fullName = googleUser.name || email.split('@')[0] || 'User';
      const avatarUrl = googleUser.picture || '';

      // Check if there's already a pending request
      const existingRequest = await AccessRequest.findOne({
        email,
        institutionId: institution._id,
        status: 'pending'
      });

      if (existingRequest) {
        // Update the existing request timestamp
        existingRequest.fullName = fullName;
        existingRequest.avatarUrl = avatarUrl;
        await existingRequest.save();

        return res.status(403).json({
          code: 'ACCESS_REQUEST_PENDING',
          message: "Your access request is still pending. Please wait for your institution's administrator to approve it."
        });
      }

      // Check if there's a previously rejected request
      const rejectedRequest = await AccessRequest.findOne({
        email,
        institutionId: institution._id,
        status: 'rejected'
      });

      if (rejectedRequest) {
        return res.status(403).json({
          code: 'ACCESS_REQUEST_REJECTED',
          message: "Your access request was previously declined by your institution's administrator. Please contact them for more information."
        });
      }

      // Create new access request
      const accessRequest = await AccessRequest.create({
        email,
        fullName,
        avatarUrl,
        institutionId: institution._id,
        status: 'pending'
      });

      // Notify all admins in this institution
      const admins = await User.find({
        institutionId: institution._id,
        role: 'admin',
        enabled: true,
        status: 'active'
      });

      for (const admin of admins) {
        await Notification.create({
          userId: admin._id,
          institutionId: institution._id,
          title: 'New Access Request',
          message: `${fullName} (${email}) is requesting access to your institution via Google Sign-in.`,
          type: 'info',
          category: 'system',
          isRead: false,
          actionUrl: '/admin/users'
        });
      }

      // Log the access request
      await logAudit({
        institutionId: institution._id,
        action: 'GOOGLE_ACCESS_REQUEST_CREATED',
        category: 'auth',
        resource: 'AccessRequest',
        resourceId: accessRequest._id as any,
        details: { email, fullName, method: 'google_oauth' },
        severity: 'medium',
        req
      });

      return res.status(403).json({
        code: 'ACCESS_REQUEST_SENT',
        message: "Your access request has been sent to your institution's administrator. You'll be able to sign in once they approve your account."
      });
    }
  } catch (error: any) {
    console.error('Google OAuth authentication error:', error);
    return res.status(500).json({
      message: "Google authentication failed",
      error: error.message
    });
  }
};

// Enhanced role-based user creation (for admins)
export const createUserByAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, role, organizationId } = req.body;
    const adminId = (req as any).user?.id;
    const adminInstitutionId = (req as any).user?.institutionId;

    if (!adminId || !adminInstitutionId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Verify admin has permission for this institution
    const adminUser = await User.findById(adminId);
    if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
      return res.status(403).json({
        message: "Insufficient permissions to create users"
      });
    }

    // Extract and validate domain
    const emailDomain = email.split('@')[1]?.toLowerCase();
    const institution = await Institution.findById(adminInstitutionId);

    if (!institution || emailDomain !== institution.domain) {
      return res.status(400).json({
        message: "Email domain must match institution domain"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      institutionId: adminInstitutionId
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists in your institution"
      });
    }

    // Create user with specified role
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName: fullName.trim(),
      role,
      institutionId: adminInstitutionId,
      organizationId,
      invitedBy: adminId,
      emailVerified: true,
      status: 'active',
      enabled: true
    });

    // Handle OrganizationMember synchronization for officers
    if (role === 'officer' && organizationId) {
      await OrganizationMember.findOneAndUpdate(
        { userId: newUser._id, organizationId, institutionId: adminInstitutionId },
        { role: 'officer', status: 'active', joinedAt: new Date() },
        { upsert: true, new: true }
      );
    }

    // Log user creation
    await logAudit({
      userId: adminId,
      institutionId: adminInstitutionId,
      action: 'USER_CREATED_BY_ADMIN',
      category: 'user_management',
      resource: 'User',
      resourceId: newUser._id,
      details: { createdEmail: newUser.email, role: newUser.role },
      severity: 'medium',
      req
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        institutionId: newUser.institutionId
      }
    });

  } catch (error: any) {
    console.error('Create user error:', error);
    res.status(500).json({
      message: "Failed to create user",
      error: error.message
    });
  }
};

// Get institution info by domain (for frontend validation)
export const getInstitutionByDomain = async (req: Request, res: Response) => {
  try {
    const { domain } = req.query;

    if (!domain) {
      return res.status(400).json({
        message: "Domain parameter is required"
      });
    }

    const institution = await Institution.findOne({
      domain: domain.toString().toLowerCase()
    });

    if (!institution) {
      return res.status(404).json({
        message: "Institution not found"
      });
    }

    // Return only public info
    res.json({
      institution: {
        name: institution.name,
        domain: institution.domain,
        status: institution.status,
        settings: {
          allowStudentRegistration: institution.settings?.allowStudentRegistration
        }
      }
    });

  } catch (error: any) {
    console.error('Get institution error:', error);
    res.status(500).json({
      message: "Failed to fetch institution info",
      error: error.message
    });
  }
};

// Super Admin Login Endpoint
export const superAdminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip || 'unknown';

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // Find Super Admin user
    const superAdmin = await User.findOne({
      email: email.toLowerCase(),
      role: "super_admin",
      institutionId: null
    });

    if (!superAdmin) {
      return res.status(401).json({
        message: "Invalid Super Admin credentials"
      });
    }

    // Check if account is enabled
    if (!superAdmin.enabled) {
      return res.status(401).json({
        message: "Super Admin account is disabled"
      });
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, superAdmin.password);
    if (!isPasswordValid) {
      // Log failed login attempt
      await logAudit({
        userId: superAdmin._id,
        action: 'SUPER_ADMIN_LOGIN_FAILED',
        category: 'auth',
        resource: 'Authentication',
        details: { email, reason: 'Invalid password' },
        severity: 'high',
        req
      });

      return res.status(401).json({
        message: "Invalid Super Admin credentials"
      });
    }

    // Update last login
    superAdmin.lastLoginAt = new Date();
    await superAdmin.save();

    // Create JWT token
    const token = jwt.sign(
      {
        id: superAdmin._id,
        role: superAdmin.role,
        email: superAdmin.email,
        isAdmin: true,
        isStudent: false
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    // Log successful login
    await logAudit({
      userId: superAdmin._id,
      action: 'SUPER_ADMIN_LOGIN_SUCCESS',
      category: 'auth',
      resource: 'Authentication',
      details: { email },
      severity: 'low',
      req
    });

    res.json({
      message: "Super Admin login successful",
      token,
      user: {
        id: superAdmin._id,
        email: superAdmin.email,
        role: superAdmin.role,
        fullName: superAdmin.fullName,
        avatarUrl: superAdmin.avatarUrl 
      }
    });

  } catch (error: any) {
    console.error('Super Admin login error:', error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Get current user profile (Settings)
 */
export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const user = await User.findById(userId, { password: 0 });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isStudent: user.role === 'student' || (await StudentProfile.exists({ userId: user._id })),
      signatureUrl: user.signatureUrl
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update current user profile (fullName, username, signatureUrl)
 */
export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { fullName, username, signatureUrl, avatarUrl } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (fullName !== undefined) user.fullName = fullName;
    if (username !== undefined) user.username = username;
    if (signatureUrl !== undefined) user.signatureUrl = signatureUrl;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        fullName: user.fullName,
        username: user.username,
        avatarUrl: user.avatarUrl,
        signatureUrl: user.signatureUrl
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update current user password
 */
export const updateMyPassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // Hash and save new password
    // Pre-save hook in User model will handle hashing if we just set user.password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Setup password for first-time Google OAuth users
 * Does NOT require current password — only works when requiresPasswordSetup is true
 */
export const setupPassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.requiresPasswordSetup) {
      return res.status(400).json({ message: "Password setup is not required for this account. Use the change password option instead." });
    }

    // Set password (pre-save hook handles hashing)
    user.password = newPassword;
    user.requiresPasswordSetup = false;
    await user.save();

    res.json({ message: "Password set successfully. You can now sign in with email and password." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Upload profile picture
 */
export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Store relative path or full URL. Usually relative + dynamic base is safer
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    user.avatarUrl = avatarPath;
    await user.save();

    res.json({
      message: "Profile picture updated",
      avatarUrl: avatarPath
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
