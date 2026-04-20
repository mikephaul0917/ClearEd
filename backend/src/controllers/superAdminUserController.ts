import { Request, Response } from 'express';
import User from '../models/User';
import Institution from '../models/Institution';
import AuditLog from '../models/AuditLog';
import { InstitutionRequest } from '../models/InstitutionRequest';
import { sendSuspensionNotification, sendPermanentDeletionNotification, sendReactivationNotification } from '../utils/emailService';

// Get users with filtering and pagination
export const getUsers = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      institutionId,
      role,
      status,
      search
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    // Build filter object
    const filter: any = {};
    
    if (institutionId) {
      filter.institutionId = institutionId;
    }
    
    if (role) {
      filter.role = role;
    }
    
    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users with pagination
    const users = await User.find(filter)
      .populate('institutionId', 'name domain')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-password -failedLoginAttempts -lockUntil -passwordResetToken -passwordResetExpires')
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      users,
      pagination: {
        current: Number(page),
        totalPages,
        total,
        limit: Number(limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Get institutions for filter dropdown
export const getInstitutions = async (req: Request, res: Response) => {
  try {
    const { status = 'approved' } = req.query;
    
    // Build filter
    const filter: any = { status };
    
    // Skip deleted institutions unless specifically requested
    const institutions = await Institution.find(filter)
      .select('name domain status email administratorName administratorPosition address contactNumber createdAt suspendedAt _id')
      .sort({ name: 1 })
      .lean();

    // Get user count for each institution
    const institutionsWithCounts = await Promise.all(
      institutions.map(async (inst) => {
        const userCount = await User.countDocuments({ 
          institutionId: inst._id,
          status: { $ne: 'deleted' }
        });
        
        return {
          ...inst,
          userCount
        };
      })
    );

    res.json({
      success: true,
      institutions: institutionsWithCounts
    });
  } catch (error: any) {
    console.error('Error fetching institutions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch institutions',
      error: error.message
    });
  }
};

// Get user statistics
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      activeUsers,
      lockedUsers,
      invitedUsers,
      institutionsCount
    ] = await Promise.all([
      User.countDocuments({ status: { $ne: 'deleted' } }),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'locked' }),
      User.countDocuments({ status: 'invited' }),
      Institution.countDocuments({ status: 'approved' })
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        lockedUsers,
        invitedUsers,
        institutions: institutionsCount
      }
    });
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
};

// Get user details (read-only)
export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate('institutionId', 'name domain status')
      .select('-password -failedLoginAttempts -lockUntil -passwordResetToken -passwordResetExpires')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error: any) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message
    });
  }
};

// Disable user account (critical override only)
export const disableUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required for disabling user account'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status === 'locked') {
      return res.status(400).json({
        success: false,
        message: 'User is already locked'
      });
    }

    // Disable the user
    await User.findByIdAndUpdate(userId, {
      status: 'locked',
      lockedAt: new Date(),
      lockReason: reason,
      lockedBy: adminId
    });

    // Create audit log
    await AuditLog.create({
      userId: adminId,
      institutionId: null, // Super Admin has no institution
      action: 'DISABLE_USER_ACCOUNT',
      resource: 'User Account',
      details: `Disabled user account: ${user.email} (${user.fullName}). Reason: ${reason}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      severity: 'high',
      category: 'user_management'
    });

    res.json({
      success: true,
      message: 'User account disabled successfully'
    });
  } catch (error: any) {
    console.error('Error disabling user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable user account',
      error: error.message
    });
  }
};

// Get invitation history for admins and officers
export const getInvitationHistory = async (req: Request, res: Response) => {
  try {
    const invitations = await User.find({
      role: { $in: ['admin', 'officer'] },
      status: { $in: ['invited', 'active'] }
    })
    .populate('institutionId', 'name domain')
    .populate('invitedBy', 'fullName email')
    .select('email role institutionId status invitedAt createdAt invitedBy')
    .sort({ createdAt: -1 })
    .lean();

    const formattedInvitations = invitations.map((inv: any) => ({
      _id: inv._id,
      email: inv.email,
      role: inv.role,
      institutionId: inv.institutionId?._id,
      institutionName: inv.institutionId?.name || 'Unknown',
      invitedBy: inv.invitedBy ? `${inv.invitedBy.fullName} (${inv.invitedBy.email})` : 'System',
      invitedAt: inv.invitedAt || inv.createdAt,
      status: inv.status === 'invited' ? 'pending' : 'accepted',
      acceptedAt: inv.status === 'active' ? inv.createdAt : undefined
    }));

    res.json({
      success: true,
      history: formattedInvitations
    });
  } catch (error: any) {
    console.error('Error fetching invitation history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitation history',
      error: error.message
    });
  }
};

// Get user activity logs (read-only monitoring)
export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);

    const user = await User.findById(userId).select('fullName email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const activities = await AuditLog.find({
      $or: [
        { 'details.user': userId },
        { userId: userId }
      ]
    })
    .populate('userId', 'fullName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

    const total = await AuditLog.countDocuments({
      $or: [
        { 'details.user': userId },
        { userId: userId }
      ]
    });

    res.json({
      success: true,
      activities,
      user: {
        fullName: user.fullName,
        email: user.email
      },
      pagination: {
        current: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        total,
        limit: Number(limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activity',
      error: error.message
    });
  }
};

/**
 * Institution Management
 */

// Revoke institution access (Suspend)
export const revokeInstitution = async (req: Request, res: Response) => {
  try {
    const { institutionId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user.id;

    const revocationReason = reason?.trim() || 'No reason provided';

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    institution.status = 'suspended';
    institution.suspendedAt = new Date();
    await institution.save();

    await AuditLog.create({
      userId: adminId,
      institutionId: null,
      action: 'REVOKE_INSTITUTION_ACCESS',
      resource: 'Institution',
      details: `Revoked access for institution: ${institution.name}. Reason: ${revocationReason}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      severity: 'high',
      category: 'institution_management'
    });

    // Send suspension notification email to institutional admin
    try {
      await sendSuspensionNotification(
        institution.email,
        institution.name,
        revocationReason
      );
    } catch (emailError) {
      console.error('Failed to send suspension email:', emailError);
      // Continue without failing the request
    }

    res.json({ success: true, message: 'Institution access revoked successfully' });
  } catch (error: any) {
    console.error('Error revoking institution:', error);
    res.status(500).json({ success: false, message: 'Failed to revoke institution access', error: error.message });
  }
};

// Reactivate institution access
export const reactivateInstitution = async (req: Request, res: Response) => {
  try {
    const { institutionId } = req.params;
    const adminId = (req as any).user.id;

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    institution.status = 'approved';
    institution.suspendedAt = undefined;
    await institution.save();

    await AuditLog.create({
      userId: adminId,
      institutionId: null,
      action: 'REACTIVATE_INSTITUTION_ACCESS',
      resource: 'Institution',
      details: `Reactivated access for institution: ${institution.name}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      severity: 'high',
      category: 'institution_management'
    });

    // Send reactivation notification email to institutional admin
    try {
      await sendReactivationNotification(
        institution.email,
        institution.name
      );
    } catch (emailError) {
      console.error('Failed to send reactivation email:', emailError);
      // Continue without failing the request
    }

    res.json({ success: true, message: 'Institution access reactivated successfully' });
  } catch (error: any) {
    console.error('Error reactivating institution:', error);
    res.status(500).json({ success: false, message: 'Failed to reactivate institution access', error: error.message });
  }
};

// Delete institution (Soft delete with 30-day window)
export const deleteInstitution = async (req: Request, res: Response) => {
  try {
    const { institutionId } = req.params;
    const adminId = (req as any).user.id;

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    institution.status = 'deleted';
    institution.deletedAt = new Date();
    await institution.save();

    await AuditLog.create({
      userId: adminId,
      institutionId: null,
      action: 'DELETE_INSTITUTION',
      resource: 'Institution',
      details: `Marked institution for deletion: ${institution.name}. Deletion will be permanent in 30 days.`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      severity: 'critical',
      category: 'institution_management'
    });

    res.json({ success: true, message: 'Institution marked for deletion. It will be permanently removed in 30 days.' });
  } catch (error: any) {
    console.error('Error deleting institution:', error);
    res.status(500).json({ success: false, message: 'Failed to delete institution', error: error.message });
  }
};

// Permanent Delete Institution (Hard delete cascade)
export const permanentDeleteInstitution = async (req: Request, res: Response) => {
  try {
    const { institutionId } = req.params;
    const adminId = (req as any).user.id;

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    const institutionName = institution.name;
    const administratorEmail = institution.email;

    // Send final notification email before deletion
    try {
      await sendPermanentDeletionNotification(administratorEmail, institutionName);
    } catch (emailError) {
      console.error('Failed to send permanent deletion email:', emailError);
      // Continue with deletion even if email fails
    }

    // Delete all users associated with this institution
    await User.deleteMany({ institutionId: institution._id });

    // Delete the accompanying InstitutionRequest document so the domain can be registered again in the future
    await InstitutionRequest.deleteMany({ academicDomain: institution.domain });

    // Delete the institution itself
    await Institution.findByIdAndDelete(institution._id);

    // Ensure this incredibly destructive action is logged carefully
    await AuditLog.create({
      userId: adminId,
      institutionId: institution._id,
      action: 'PERMANENTLY_DELETE_INSTITUTION',
      resource: 'Institution',
      details: `Permanently destroyed institution: ${institutionName} and all associated users/staff data.`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      severity: 'critical',
      category: 'institution_management'
    });

    res.json({ success: true, message: `Institution ${institutionName} permanently deleted` });
  } catch (error: any) {
    console.error('Error permanently deleting institution:', error);
    res.status(500).json({ success: false, message: 'Failed to permanently delete institution', error: error.message });
  }
};
