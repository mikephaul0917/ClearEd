import { Request, Response } from "express";
import ClearanceRequirement from "../models/ClearanceRequirement";
import ClearanceSubmission, { IClearanceSubmission } from "../models/ClearanceSubmission";
import ClearanceRequest from "../models/ClearanceRequest";
import User from "../models/User";
import OrganizationMember from "../models/OrganizationMember";
import Term from "../models/Term";
import AuditLog from "../models/AuditLog";
import { logAudit } from "../utils/auditLogger";
import mongoose from "mongoose";
import fs from 'fs';
import path from 'path';

/**
 * Get all clearance requirements and their submission status for a student within an organization
 */
export const getClearanceRequirements = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const institutionId = (req as any).user.institutionId;
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }

    // 1. Determine user role in this organization
    const member = await OrganizationMember.findOne({
      userId: new mongoose.Types.ObjectId(userId as string),
      organizationId: new mongoose.Types.ObjectId(organizationId as string),
      status: 'active'
    });

    const isAdmin = (req as any).user.role === 'admin' || (req as any).user.role === 'super_admin';
    const isOfficer = member?.role === 'officer' || isAdmin;

    // 2. Fetch requirements for the organization
    const query: any = {
      organizationId: new mongoose.Types.ObjectId(organizationId as string),
      institutionId: new mongoose.Types.ObjectId(institutionId as string),
      isActive: true
    };

    if (!isOfficer) {
      // Students only see requirements assigned to them, or assigned to everyone (empty array/not present)
      query.$or = [
        { assignedTo: { $exists: false } },
        { assignedTo: { $size: 0 } },
        { assignedTo: new mongoose.Types.ObjectId(userId as string) }
      ];
    }

    const requirements = await ClearanceRequirement.find(query)
      .populate('createdBy', 'fullName avatarUrl')
      .sort({ order: 1 });

    // 2. Fetch submissions for this user in this organization
    const submissions = await ClearanceSubmission.find({
      userId: new mongoose.Types.ObjectId(userId as string),
      organizationId: new mongoose.Types.ObjectId(organizationId as string),
      institutionId: new mongoose.Types.ObjectId(institutionId as string)
    });

    // 3. Fetch stats if officer
    let stats: any[] = [];
    let totalMembers = 0;
    if (isOfficer) {
      stats = await ClearanceSubmission.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId as string) } },
        { $group: { _id: { requirementId: "$clearanceRequirementId", status: "$status" }, count: { $sum: 1 } } }
      ]);
      totalMembers = await OrganizationMember.countDocuments({
        organizationId: new mongoose.Types.ObjectId(organizationId as string),
        role: "member",
        status: "active"
      });
    }

    // 4. Map requirements to submission status
    const requirementsWithStatus = requirements.map(reqItem => {
      const reqIdStr = (reqItem as any)._id.toString();
      const submission = submissions.find(sub => sub.clearanceRequirementId.toString() === reqIdStr);
      
      let reqStats = undefined;
      if (isOfficer) {
        const rStats = stats.filter(s => s._id.requirementId && s._id.requirementId.toString() === reqIdStr);
        reqStats = {
          pending: rStats.find(s => s._id.status === 'pending')?.count || 0,
          approved: rStats.find(s => s._id.status === 'approved')?.count || 0,
          rejected: rStats.find(s => s._id.status === 'rejected')?.count || 0,
          resubmission_required: rStats.find(s => s._id.status === 'resubmission_required')?.count || 0,
          totalMembers
        };
      }

      return {
        ...reqItem.toObject(),
        submission: submission ? {
          id: submission._id,
          status: submission.status,
          submittedAt: submission.submittedAt,
          files: submission.files,
          notes: submission.notes,
          rejectionReason: submission.rejectionReason,
          reviewedAt: submission.reviewedAt
        } : null,
        stats: reqStats
      };
    });

    res.json({
      success: true,
      data: requirementsWithStatus
    });
  } catch (error: any) {
    console.error('Error fetching clearance requirements:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch requirements"
    });
  }
};

/**
 * Submit a clearance requirement
 */
export const submitRequirement = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const institutionId = (req as any).user.institutionId;
    const { clearanceRequirementId, organizationId, studentNotes } = req.body;

    if (!clearanceRequirementId || !organizationId) {
      return res.status(400).json({ success: false, message: "Requirement ID and Organization ID are required" });
    }

    // 1. Verify requirement exists
    const requirement = await ClearanceRequirement.findOne({
      _id: new mongoose.Types.ObjectId(clearanceRequirementId as string),
      organizationId: new mongoose.Types.ObjectId(organizationId as string),
      institutionId: new mongoose.Types.ObjectId(institutionId as string),
      isActive: true
    });

    if (!requirement) {
      return res.status(404).json({ success: false, message: "Clearance requirement not found" });
    }

    // 2. Find or verify the parent ClearanceRequest
    let clearanceRequest = await ClearanceRequest.findOne({
      userId: new mongoose.Types.ObjectId(userId as string),
      organizationId: new mongoose.Types.ObjectId(organizationId as string),
      institutionId: new mongoose.Types.ObjectId(institutionId as string),
    });

    if (!clearanceRequest) {
      // Create it on the fly if an active term exists
      const activeTerm = await Term.findOne({ institutionId, isActive: true });
      if (!activeTerm) {
        return res.status(400).json({ success: false, message: "No active academic term found. Contact admin." });
      }

      clearanceRequest = await ClearanceRequest.create({
        userId,
        organizationId,
        institutionId,
        termId: activeTerm._id,
        status: "in_progress",
        submittedAt: new Date()
      });
      console.log(`[DEBUG] Auto-created ClearanceRequest for user ${userId} during submission.`);
    }

    const uploadedFiles = (req as any).uploadedFiles || [];

    // 3. Check for existing submission
    let submission = await ClearanceSubmission.findOne({
      userId,
      clearanceRequirementId,
      clearanceRequestId: clearanceRequest._id
    });

    if (submission) {
      // Update existing submission
      submission.files = [...submission.files, ...uploadedFiles];
      submission.status = 'pending';
      submission.studentNotes = studentNotes;
      submission.submittedAt = new Date();
      await submission.save();
    } else {
      // Create new submission
      submission = await ClearanceSubmission.create({
        userId,
        clearanceRequirementId,
        clearanceRequestId: clearanceRequest._id,
        organizationId,
        institutionId,
        files: uploadedFiles,
        status: 'pending',
        studentNotes,
        submittedAt: new Date()
      });
    }

    // 4. Log Action
    await logAudit({
      userId,
      institutionId,
      action: 'clearance_requirement_submitted',
      category: 'clearance_workflow',
      resource: 'ClearanceSubmission',
      resourceId: submission._id as any,
      details: { requirementTitle: requirement.title },
      severity: 'low',
      req
    });

    res.json({
      success: true,
      message: "Requirement submitted successfully",
      data: submission
    });
  } catch (error: any) {
    console.error('Error submitting requirement:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit requirement"
    });
  }
};

/**
 * Get submissions for review by an officer (Signatory)
 * Filters by requirements the officer is authorized to review
 */
export const getOfficerSubmissions = async (req: Request, res: Response) => {
  try {
    const officerId = (req as any).user.id;
    const institutionId = (req as any).user.institutionId;

    if (!officerId || !institutionId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 1. Find organizations where the user is an officer
    const officerRoles = await OrganizationMember.find({
      userId: new mongoose.Types.ObjectId(officerId as string),
      institutionId: new mongoose.Types.ObjectId(institutionId as string),
      role: "officer",
      status: "active"
    });

    const organizationIds = officerRoles.map(org => org.organizationId);

    if (organizationIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // 2. Fetch submissions for these organizations (return ALL statuses so frontend can show stats)
    const submissions = await ClearanceSubmission.find({
      institutionId: new mongoose.Types.ObjectId(institutionId as string),
      organizationId: { $in: organizationIds }
    })
      .populate('userId', 'fullName email studentId name avatarUrl')
      .populate('clearanceRequirementId', 'title description')
      .populate('organizationId', 'name')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error: any) {
    console.error('Error fetching officer submissions:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch submissions"
    });
  }
};

/**
 * Get all submissions for a specific requirement (for Officers)
 */
export const getRequirementSubmissions = async (req: Request, res: Response) => {
  try {
    const { requirementId } = req.params;
    const institutionId = (req as any).user.institutionId;

    const submissions = await ClearanceSubmission.find({
      clearanceRequirementId: requirementId,
      institutionId
    })
      .populate('userId', 'fullName email studentId avatarUrl')
      .sort({ submittedAt: 1 });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error: any) {
    console.error('Error fetching requirement submissions:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch submissions"
    });
  }
};

/**
 * Download a submitted file
 */
export const downloadFile = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const institutionId = (req as any).user.institutionId;

    const submission = await ClearanceSubmission.findOne({
      institutionId,
      'files.filename': filename
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    const filePath = path.join(process.cwd(), 'uploads', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "File missing on server" });
    }

    const file = submission.files.find(f => f.filename === filename);
    res.download(filePath, file?.originalName || filename);
  } catch (error: any) {
    console.error('Error downloading file:', error);
    res.status(500).json({ success: false, message: "Download failed" });
  }
};

/**
 * Get a single clearance requirement and the current user's submission
 */
export const getClearanceRequirementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const institutionId = (req as any).user.institutionId;

    const requirement = await ClearanceRequirement.findOne({
      _id: new mongoose.Types.ObjectId(id),
      institutionId: new mongoose.Types.ObjectId(institutionId as string)
    }).populate('createdBy', 'fullName avatarUrl');

    if (!requirement) {
      return res.status(404).json({ success: false, message: "Requirement not found" });
    }

    let submissionData = null;
    const submission = await ClearanceSubmission.findOne({
      userId: new mongoose.Types.ObjectId(userId as string),
      clearanceRequirementId: requirement._id,
      institutionId: new mongoose.Types.ObjectId(institutionId as string)
    });

    if (submission) {
      submissionData = {
        id: submission._id,
        status: submission.status,
        submittedAt: submission.submittedAt,
        files: submission.files,
        studentNotes: submission.studentNotes,
        rejectionReason: submission.rejectionReason,
        reviewedAt: submission.reviewedAt
      };
    }

    res.json({
      success: true,
      data: {
        ...requirement.toObject(),
        submission: submissionData
      }
    });

  } catch (error: any) {
    console.error('Error fetching clearance requirement:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch requirement"
    });
  }
};
