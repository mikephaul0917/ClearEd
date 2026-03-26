import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/User";
import Institution from "../models/Institution";
import AuditLog from "../models/AuditLog";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    institutionId: string;
    email: string;
  };
}

// Get Institution Users
export const getInstitutionUsers = async (req: AuthRequest, res: Response) => {
  try {
    const institutionId = req.user?.institutionId;
    const { page = 1, limit = 10, search, role } = req.query;

    // Build query
    const query: any = { institutionId };
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -emailVerificationToken -passwordResetToken')
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error: any) {
    console.error('Get institution users error:', error);
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message
    });
  }
};

// Create User (Institution Admin Only)
export const createInstitutionUser = async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, password, fullName, role = 'student' } = req.body;
    const adminId = req.user?.id;
    const institutionId = req.user?.institutionId;

    // Verify admin permissions
    if (!req.user?.role || !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        message: "Insufficient permissions to create users"
      });
    }

    // Validate required fields
    if (!email || !password || !fullName) {
      return res.status(400).json({
        message: "Email, password, and full name are required"
      });
    }

    // Validate email domain against institution
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ message: "Institution not found" });
    }

    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (emailDomain !== institution.domain) {
      return res.status(400).json({
        message: "Email domain must match institution domain"
      });
    }

    // Check if user already exists in institution
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      institutionId
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists in your institution"
      });
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      fullName: fullName.trim(),
      role,
      institutionId,
      invitedBy: adminId,
      emailVerified: true,
      status: 'active',
      enabled: true
    });

    // Log user creation
    await AuditLog.create({
      userId: adminId,
      institutionId,
      action: 'user_created_by_admin',
      resource: 'User',
      resourceId: user._id,
      details: {
        createdUser: {
          email: user.email,
          role: user.role
        }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'medium',
      category: 'user_management'
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        institutionId: user.institutionId,
        avatarUrl: user.avatarUrl
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

// Update User Role
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const adminId = req.user?.id;
    const institutionId = req.user?.institutionId;

    // Verify admin permissions
    if (!req.user?.role || !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        message: "Insufficient permissions to update user roles"
      });
    }

    // Validate role
    const validRoles = ['student', 'officer', 'dean', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role"
      });
    }

    // Check if target user exists in same institution
    const targetUser = await User.findOne({
      _id: userId,
      institutionId
    });

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent self-role modification for non-super-admins
    if (userId === adminId && req.user?.role !== 'super_admin') {
      return res.status(403).json({
        message: "Cannot modify your own role"
      });
    }

    const oldRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    // Log role change
    await AuditLog.create({
      userId: adminId,
      institutionId,
      action: 'user_role_updated',
      resource: 'User',
      resourceId: targetUser._id,
      details: {
        oldRole,
        newRole: role
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'medium',
      category: 'user_management'
    });

    res.json({
      message: "User role updated successfully",
      user: {
        id: targetUser._id,
        email: targetUser.email,
        avatarUrl: targetUser.avatarUrl,
        role: targetUser.role
      }
    });

  } catch (error: any) {
    console.error('Update user role error:', error);
    res.status(500).json({
      message: "Failed to update user role",
      error: error.message
    });
  }
};

// Disable/Enable User
export const updateUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { enabled, isActive } = req.body;
    const adminId = req.user?.id;
    const institutionId = req.user?.institutionId;

    // Verify admin permissions
    if (!req.user?.role || !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        message: "Insufficient permissions to update user status"
      });
    }

    const targetUser = await User.findOne({
      _id: userId,
      institutionId
    });

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user status
    if (enabled !== undefined) targetUser.enabled = enabled;
    if (isActive !== undefined) targetUser.status = isActive ? 'active' : 'locked';
    await targetUser.save();

    // Log status change
    await AuditLog.create({
      userId: adminId,
      institutionId,
      action: 'user_status_updated',
      resource: 'User',
      resourceId: targetUser._id,
      details: {
        enabled: targetUser.enabled,
        status: targetUser.status
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'medium',
      category: 'user_management'
    });

    res.json({
      message: "User status updated successfully",
      user: {
        id: targetUser._id,
        avatarUrl: targetUser.avatarUrl,
        enabled: targetUser.enabled,
        status: targetUser.status
      }
    });

  } catch (error: any) {
    console.error('Update user status error:', error);
    res.status(500).json({
      message: "Failed to update user status",
      error: error.message
    });
  }
};

// Delete User (Soft Delete)
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id;
    const institutionId = req.user?.institutionId;

    // Verify admin permissions
    if (!req.user?.role || !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        message: "Insufficient permissions to delete users"
      });
    }

    const targetUser = await User.findOne({
      _id: userId,
      institutionId
    });

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent self-deletion for non-super-admins
    if (userId === adminId && req.user?.role !== 'super_admin') {
      return res.status(403).json({
        message: "Cannot delete your own account"
      });
    }

    // Soft delete user (lock account and disable)
    targetUser.status = 'locked';
    targetUser.enabled = false;
    await targetUser.save();

    // Log user deletion
    await AuditLog.create({
      userId: adminId,
      institutionId,
      action: 'user_deleted',
      resource: 'User',
      resourceId: targetUser._id,
      details: {
        deletedUser: {
          email: targetUser.email
        }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'high',
      category: 'user_management'
    });

    res.json({
      message: "User deleted successfully"
    });

  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({
      message: "Failed to delete user",
      error: error.message
    });
  }
};
