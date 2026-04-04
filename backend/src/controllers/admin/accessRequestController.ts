import { Request, Response } from "express";
import AccessRequest from "../../models/AccessRequest";
import User from "../../models/User";
import Notification from "../../models/Notification";
import { logAudit } from "../../utils/auditLogger";
import bcrypt from "bcrypt";
import crypto from "crypto";

const resolveInstitutionId = (req: Request) => {
  const user = (req as any).user;
  if (!user) return null;
  if (user.role === 'super_admin') {
    return req.query.institutionId || req.body.institutionId || user.institutionId;
  }
  return user.institutionId;
};

/**
 * List access requests for the admin's institution
 */
export const listAccessRequests = async (req: Request, res: Response) => {
  try {
    const institutionId = resolveInstitutionId(req);
    if (!institutionId) return res.status(401).json({ message: "Unauthorized" });

    const { status } = req.query;
    const query: any = { institutionId };
    if (status) query.status = status;

    const requests = await AccessRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get count of pending access requests (for badge/notification)
 */
export const getAccessRequestCount = async (req: Request, res: Response) => {
  try {
    const institutionId = resolveInstitutionId(req);
    if (!institutionId) return res.status(401).json({ message: "Unauthorized" });

    const count = await AccessRequest.countDocuments({ institutionId, status: 'pending' });
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Approve an access request — creates the user account
 */
export const approveAccessRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // Admin can assign a role (default: student)
    const institutionId = resolveInstitutionId(req);
    const adminId = (req as any).user?.id;

    const accessRequest = await AccessRequest.findOne({ _id: id, institutionId });
    if (!accessRequest) return res.status(404).json({ message: "Access request not found" });

    if (accessRequest.status !== 'pending') {
      return res.status(400).json({ message: `Request has already been ${accessRequest.status}` });
    }

    // Check if user already exists (race condition check)
    const existingUser = await User.findOne({ email: accessRequest.email, institutionId });
    if (existingUser) {
      accessRequest.status = 'approved';
      accessRequest.reviewedBy = adminId;
      accessRequest.reviewedAt = new Date();
      await accessRequest.save();
      return res.json({ message: "User already exists. Request marked as approved.", user: existingUser });
    }

    // Create the user account
    const hashedPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
    const newUser = await User.create({
      email: accessRequest.email,
      password: hashedPassword,
      fullName: accessRequest.fullName,
      avatarUrl: accessRequest.avatarUrl || '',
      role: role || 'student',
      institutionId,
      emailVerified: true,
      status: 'active',
      enabled: true,
      failedLoginAttempts: 0,
      authProvider: 'google',
      requiresPasswordSetup: true
    });

    // Update access request status
    accessRequest.status = 'approved';
    accessRequest.reviewedBy = adminId;
    accessRequest.reviewedAt = new Date();
    await accessRequest.save();

    // Log audit
    await logAudit({
      userId: adminId,
      institutionId,
      action: 'ACCESS_REQUEST_APPROVED',
      category: 'user_management',
      resource: 'User',
      resourceId: newUser._id,
      details: {
        email: accessRequest.email,
        fullName: accessRequest.fullName,
        assignedRole: role || 'student'
      },
      severity: 'medium',
      req
    });

    res.json({
      message: "Access request approved. User account created.",
      user: {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl
      }
    });
  } catch (error: any) {
    console.error('Approve access request error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Reject an access request
 */
export const rejectAccessRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const institutionId = resolveInstitutionId(req);
    const adminId = (req as any).user?.id;

    const accessRequest = await AccessRequest.findOne({ _id: id, institutionId });
    if (!accessRequest) return res.status(404).json({ message: "Access request not found" });

    if (accessRequest.status !== 'pending') {
      return res.status(400).json({ message: `Request has already been ${accessRequest.status}` });
    }

    accessRequest.status = 'rejected';
    accessRequest.reviewedBy = adminId;
    accessRequest.reviewedAt = new Date();
    accessRequest.rejectionReason = reason || '';
    await accessRequest.save();

    // Log audit
    await logAudit({
      userId: adminId,
      institutionId,
      action: 'ACCESS_REQUEST_REJECTED',
      category: 'user_management',
      resource: 'AccessRequest',
      resourceId: accessRequest._id as any,
      details: {
        email: accessRequest.email,
        reason: reason || 'No reason provided'
      },
      severity: 'medium',
      req
    });

    res.json({ message: "Access request rejected." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
