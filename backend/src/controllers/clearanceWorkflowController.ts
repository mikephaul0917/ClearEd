import { Request, Response } from "express";
import mongoose from "mongoose";
import ClearanceRequest from "../models/ClearanceRequest";
import Organization from "../models/Organization";
import OrganizationMember from "../models/OrganizationMember";
import ClearanceRequirement from "../models/ClearanceRequirement";
import ClearanceSubmission from "../models/ClearanceSubmission";
import User from "../models/User";
import AuditLog from "../models/AuditLog";
import { logAudit } from "../utils/auditLogger";
import Term from "../models/Term";
import { AuthRequest } from "../middleware/authMiddleware";

/**
 * Get pending clearance requests for an organization (for administrators/high-level viewing)
 */
export const getOrganizationClearanceOverview = async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId } = req.params;
    const institutionId = req.user?.institutionId;

    if (!institutionId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Verify organization exists
    const organization = await Organization.findOne({
      _id: organizationId
    });

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Get active term
    // Fallback securely to the organization's own institutionId if needed, but simply isActive is usually fine for a single-tenant dev setup
    const term = await Term.findOne({ institutionId: organization.institutionId, isActive: true }) || await Term.findOne({ isActive: true });
    
    if (!term) return res.status(400).json({ message: "No active term found" });

    // Get all active members for this organization
    const members = await OrganizationMember.find({
      organizationId,
      role: 'member',
      status: 'active'
    }).populate("userId", "fullName email");

    const requests = await ClearanceRequest.find({
      organizationId,
      termId: term._id
    }).populate("userId", "fullName email")
      .sort({ submittedAt: -1 });

    // For each request, calculate progress based on requirements vs submissions
    const requirementsCount = await ClearanceRequirement.countDocuments({
      organizationId,
      isActive: true,
      isAnnouncement: { $ne: true },
      type: { $nin: ['announcement', 'material'] }
    });

    const requestsWithProgress = await Promise.all(members.map(async (member: any) => {
      // Skip if referenced user was deleted
      if (!member.userId || !member.userId._id) return null;

      let status = "not_started";
      let completedCount = 0;
      let reqId = null;
      let submittedAt = null;

      const userReq = requests.find(r => (r.userId as any)?._id?.toString() === member.userId._id.toString());
      if (userReq) {
        reqId = userReq._id;
        status = userReq.status;
        submittedAt = userReq.submittedAt;
        const approvedSubmissions = await ClearanceSubmission.countDocuments({
          clearanceRequestId: userReq._id,
          status: "approved"
        });
        completedCount = approvedSubmissions;
      }

      return {
        id: reqId || member._id,
        student: member.userId,
        status: status,
        progress: {
          total: requirementsCount,
          completed: completedCount
        },
        submittedAt
      };
    }));

    // Filter out nulls from deleted users
    const validRequests = requestsWithProgress.filter(r => r !== null);

    res.json({
      organization: { id: organization._id, name: organization.name },
      term: { id: term._id, name: term.name },
      requests: validRequests
    });

  } catch (error: any) {
    console.error('Get organization overview error:', error);
    res.status(500).json({
      message: "Failed to fetch organization clearance overview",
      error: error.message
    });
  }
};

/**
 * Update the overall status of a clearance request
 * Usually done automatically but can be manually overridden by admins
 */
export const updateRequestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const adminId = req.user?.id;
    const institutionId = req.user?.institutionId;

    if (!['pending', 'in_progress', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const clearanceRequest = await ClearanceRequest.findOne({
      _id: requestId,
      institutionId
    });

    if (!clearanceRequest) {
      return res.status(404).json({ message: "Clearance request not found" });
    }

    const oldStatus = clearanceRequest.status;
    clearanceRequest.status = status;
    if (status === 'completed') {
      clearanceRequest.finalApprovalDate = new Date();
    }
    await clearanceRequest.save();

    // Log the action
    await logAudit({
      userId: adminId,
      institutionId,
      action: 'clearance_request_status_updated',
      category: 'clearance_workflow',
      resource: 'ClearanceRequest',
      resourceId: clearanceRequest._id as any,
      details: { oldStatus, newStatus: status },
      severity: 'medium',
      req
    });

    res.json({
      message: "Clearance request status updated successfully",
      status: clearanceRequest.status
    });

  } catch (error: any) {
    console.error('Update request status error:', error);
    res.status(500).json({
      message: "Failed to update clearance request status",
      error: error.message
    });
  }
};

/**
 * Get overall institution statistics for a term
 */
export const getInstitutionStats = async (req: AuthRequest, res: Response) => {
  try {
    const institutionId = req.user?.institutionId;
    const { termId } = req.query;

    if (!institutionId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const query: any = { institutionId };
    if (termId) query.termId = termId;

    const totalRequests = await ClearanceRequest.countDocuments(query);
    const completedRequests = await ClearanceRequest.countDocuments({ ...query, status: 'completed' });
    const pendingRequests = await ClearanceRequest.countDocuments({ ...query, status: 'pending' });
    const rejectedRequests = await ClearanceRequest.countDocuments({ ...query, status: 'rejected' });

    res.json({
      total: totalRequests,
      completed: completedRequests,
      pending: pendingRequests,
      rejected: rejectedRequests,
      completionRate: totalRequests > 0 ? ((completedRequests / totalRequests) * 100).toFixed(1) : '0'
    });

  } catch (error: any) {
    console.error('Get institution stats error:', error);
    res.status(500).json({
      message: "Failed to fetch institution statistics",
      error: error.message
    });
  }
};
