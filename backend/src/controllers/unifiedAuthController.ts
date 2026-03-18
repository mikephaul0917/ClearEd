import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Institution from "../models/Institution";
import OrganizationMember from "../models/OrganizationMember";
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
          isAdmin: true
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
      if (!valid) return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign(
        {
          id: existingUser._id,
          role: existingUser.role,
          email: existingUser.email,
          institutionId: existingUser.institutionId,
          isAdmin: existingUser.role === 'admin'
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
          role: existingUser.role,
          institutionId: existingUser.institutionId,
          isNewUser: false
        }
      });

    } else {
      // 6. First-time Student Auto-Enrollment
      if (!institution.settings?.allowStudentRegistration) {
        return res.status(403).json({ message: "Self-enrollment is disabled for your institution." });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        fullName: email.split('@')[0],
        role: 'student',
        institutionId: institution._id,
        status: 'active',
        enabled: true
      });

      const token = jwt.sign(
        {
          id: newUser._id,
          role: newUser.role,
          email: newUser.email,
          institutionId: newUser.institutionId,
          isAdmin: false
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

      // Update last login
      user.lastLoginAt = new Date();
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
          isAdmin: user.role === 'admin'
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
          role: user.role,
          institutionId: user.institutionId,
          lastLoginAt: user.lastLoginAt,
          isNewUser: false
        }
      });
    } else {
      // First-time user - auto-create account
      console.log(`[DEBUG] Google OAuth: Creating new user for email: ${email}, institutionId: ${institution._id}`);

      try {
        const hashedPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);

        // Validate required fields before creation
        const fullName = googleUser.name || email.split('@')[0] || 'User';

        console.log(`[DEBUG] Google OAuth: User creation data:`, {
          email: email,
          fullName,
          role: 'student',
          institutionId: institution._id
        });

        const newUser = await User.create({
          email: email,
          password: hashedPassword,
          fullName: fullName,
          role: 'student',
          institutionId: institution._id,
          emailVerified: true,
          status: 'active',
          enabled: true,
          failedLoginAttempts: 0,
          authProvider: 'google'
        });

        console.log(`[DEBUG] Google OAuth: New user created successfully:`, {
          id: newUser._id,
          email: newUser.email,
          role: newUser.role,
          institutionId: newUser.institutionId,
          fullName: newUser.fullName
        });

        // Verify user was created successfully
        console.log(`[DEBUG] Google OAuth: Verifying user creation...`);
        const createdUser = await User.findOne({
          email: email,
          institutionId: institution._id
        });

        if (!createdUser) {
          console.error(`[DEBUG] Google OAuth: User creation verification failed - user not found after creation`);
          return res.status(500).json({
            message: "User creation verification failed"
          });
        }

        console.log(`[DEBUG] Google OAuth: User creation verified:`, {
          id: createdUser._id,
          email: createdUser.email,
          role: createdUser.role
        });

        // Log auto-enrollment
        await logAudit({
          userId: createdUser._id,
          institutionId: institution._id,
          action: 'GOOGLE_USER_AUTO_ENROLLED',
          category: 'user_management',
          resource: 'User',
          resourceId: createdUser._id,
          details: { email, method: 'google_oauth' },
          severity: 'medium',
          req
        });

        // Create JWT token
        const jwtToken = jwt.sign(
          {
            id: createdUser._id,
            role: createdUser.role,
            institutionId: createdUser.institutionId,
            email: createdUser.email,
            isAdmin: false
          },
          process.env.JWT_SECRET as string,
          { expiresIn: '24h' }
        );

        return res.json({
          token: jwtToken,
          user: {
            id: createdUser._id,
            email: createdUser.email,
            fullName: createdUser.fullName,
            role: createdUser.role,
            institutionId: createdUser.institutionId,
            isNewUser: true,
            requiresProfileUpdate: true
          },
          institution: {
            id: institution._id,
            name: institution.name,
            status: institution.status
          }
        });

      } catch (createError: any) {
        console.error(`[DEBUG] Google OAuth: User creation failed:`, createError);
        return res.status(500).json({
          message: "User creation failed",
          error: createError.message
        });
      }
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
        isAdmin: true
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
        fullName: superAdmin.fullName
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
