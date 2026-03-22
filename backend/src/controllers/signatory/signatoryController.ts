import { Request, Response } from "express";
import mongoose from "mongoose";
import ClearanceRequest from "../../models/ClearanceRequest";
import ClearanceSubmission from "../../models/ClearanceSubmission";
import ClearanceReview from "../../models/ClearanceReview";
import OrganizationMember from "../../models/OrganizationMember";
import ClearanceRequirement from "../../models/ClearanceRequirement";
import User from "../../models/User";
import Term from "../../models/Term";
import AuditLog from "../../models/AuditLog";

/**
 * List pending submissions for the current officer/dean
 * Filters by organizations where the user has officer permissions
 */
export const listPending = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;

    if (!userId || !institutionId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 1. Find organizations where the user is an officer
    const officerRoles = await OrganizationMember.find({
      userId,
      institutionId,
      role: "officer",
      status: "active"
    });

    const organizationIds = officerRoles.map(org => org.organizationId);

    if (organizationIds.length === 0) {
      return res.json({ rows: [] });
    }

    // 2. Get active term
    const term = await Term.findOne({ institutionId, isActive: true });
    if (!term) return res.json({ rows: [] });

    // 3. Find pending submissions for these organizations
    const submissions = await ClearanceSubmission.find({
      organizationId: { $in: organizationIds },
      institutionId,
      status: "pending"
    }).populate("userId", "fullName email")
      .populate("clearanceRequirementId", "title description")
      .populate("organizationId", "name")
      .sort({ submittedAt: 1 });

    const rows = submissions.map(sub => {
      const student = sub.userId as any;
      const reqItem = sub.clearanceRequirementId as any;
      const org = sub.organizationId as any;

      return {
        id: sub._id,
        studentName: student?.fullName || "Unknown",
        studentEmail: student?.email,
        organizationName: org?.name || "Unknown",
        requirementTitle: reqItem?.title || "Requirement",
        submittedAt: sub.submittedAt,
        files: sub.files,
        status: sub.status
      };
    });

    res.json({ rows });
  } catch (err: any) {
    console.error('List pending error:', err);
    res.status(500).json({ message: err.message || "Failed to list pending submissions" });
  }
};

/**
 * Review a clearance submission (Approve or Reject)
 * Creates a ClearanceReview record and updates the submission status
 */
export const reviewSubmission = async (req: Request, res: Response) => {
  try {
    const reviewerId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;
    const role = (req as any).user?.role; // 'officer' or 'dean'
    const { submissionId } = req.params;
    const { decision, remarks } = req.body;

    if (!reviewerId || !institutionId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: "Invalid decision. Must be 'approved' or 'rejected'" });
    }

    if (decision === 'rejected' && (!remarks || remarks.trim() === '')) {
      return res.status(400).json({ message: "Remarks are required for rejections" });
    }

    // 1. Find submission and verify review authority
    const submission = await ClearanceSubmission.findOne({
      _id: submissionId,
      institutionId
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // 2. Check if reviewer is officer in the organization
    const membership = await OrganizationMember.findOne({
      userId: reviewerId,
      organizationId: submission.organizationId,
      role: "officer",
      status: "active"
    });

    if (!membership && role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ message: "You do not have permission to review this submission" });
    }

    // 3. Create Review Record
    const review = await ClearanceReview.create({
      submissionId,
      reviewerId,
      decision,
      level: role === 'dean' ? 'dean' : 'officer',
      remarks,
      institutionId
    });

    // 4. Update Submission Status
    submission.status = decision === 'approved' ? 'approved' : 'rejected';
    submission.reviewedBy = reviewerId;
    submission.reviewedAt = new Date();
    submission.notes = remarks;
    await submission.save();

    // 5. Log Action
    await AuditLog.create({
      userId: reviewerId,
      institutionId,
      action: decision === 'approved' ? 'clearance_approved' : 'clearance_rejected',
      category: 'clearance_workflow',
      resource: 'ClearanceSubmission',
      resourceId: submission._id,
      details: {
        decision,
        remarks,
        studentId: submission.userId
      },
      severity: 'medium',
      ipAddress: req.ip || 'unknown'
    });

    res.json({
      message: `Submission ${decision} successfully`,
      review,
      submissionStatus: submission.status
    });

  } catch (err: any) {
    console.error('Review submission error:', err);
    res.status(500).json({ message: err.message || "Failed to process review" });
  }
};

/**
 * Requirement Management for Officers
 */

export const getSignatoryRequirements = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;

    const officerRoles = await OrganizationMember.find({
      userId,
      institutionId,
      role: "officer",
      status: "active"
    });

    const organizationIds = officerRoles.map(org => org.organizationId);

    if (organizationIds.length === 0) {
      return res.json({ requirements: [] });
    }

    const requirements = await ClearanceRequirement.find({
      organizationId: { $in: organizationIds },
      institutionId
    }).populate("organizationId", "name")
      .sort({ createdAt: -1 });

    const stats = await ClearanceSubmission.aggregate([
      { $match: { organizationId: { $in: organizationIds } } },
      { $group: { _id: { requirementId: "$clearanceRequirementId", status: "$status" }, count: { $sum: 1 } } }
    ]);

    const requirementsWithStats = requirements.map(reqObj => {
      const reqIdStr = (reqObj._id as any).toString();
      const reqStats = stats.filter(s => s._id.requirementId && s._id.requirementId.toString() === reqIdStr);
      return {
        ...reqObj.toObject(),
        stats: {
          pending: reqStats.find(s => s._id.status === 'pending')?.count || 0,
          approved: reqStats.find(s => s._id.status === 'approved')?.count || 0,
          rejected: reqStats.find(s => s._id.status === 'rejected')?.count || 0
        }
      };
    });

    res.json({ requirements: requirementsWithStats });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to list requirements" });
  }
};

export const createSignatoryRequirement = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;
    const { organizationId, title, description, instructions, type, requiredFiles, isMandatory, isAnnouncement, attachments: rawUrlAttachments, options, dueDate, points } = req.body;

    const membership = await OrganizationMember.findOne({
      userId,
      organizationId,
      institutionId,
      role: "officer",
      status: "active"
    });

    if (!membership) {
      return res.status(403).json({ message: "You do not have permission to manage requirements for this organization" });
    }

    // Handle URL attachments from JSON
    let urlAttachments: any[] = [];
    if (rawUrlAttachments) {
      try {
        urlAttachments = JSON.parse(rawUrlAttachments);
      } catch (e) {
        console.error("Failed to parse URL attachments", e);
      }
    }
    
    // Handle File attachments from multer
    let fileAttachments: any[] = [];
    if (req.files && Array.isArray(req.files)) {
      fileAttachments = req.files.map((file: any) => ({
        name: file.originalname,
        url: `/uploads/${file.filename}`,
        type: file.mimetype
      }));
    }

    // Parse options if sent as stringified JSON
    let parsedOptions: string[] = [];
    if (options) {
      try {
        parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
      } catch (e) {
        console.error("Failed to parse options", e);
      }
    }

    const requirement = await ClearanceRequirement.create({
      title,
      description,
      instructions,
      requiredFiles: requiredFiles ? (Array.isArray(requiredFiles) ? requiredFiles : [requiredFiles]) : [],
      attachments: [...urlAttachments, ...fileAttachments],
      isMandatory: isMandatory === "true" || isMandatory === true,
      isAnnouncement: isAnnouncement === "true" || isAnnouncement === true,
      type: type || 'requirement',
      options: parsedOptions,
      organizationId,
      institutionId,
      createdBy: userId,
      isActive: true,
      dueDate: dueDate || undefined,
      points: points || undefined
    });

    res.status(201).json({ message: "Requirement created", requirement });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to create requirement" });
  }
};

export const updateSignatoryRequirement = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;
    const { id } = req.params;
    const { title, description, instructions, requiredFiles, isMandatory, isAnnouncement, isActive, attachments: rawUrlAttachments, options, dueDate, points } = req.body;

    const requirement = await ClearanceRequirement.findOne({ _id: id, institutionId });
    if (!requirement) return res.status(404).json({ message: "Requirement not found" });

    const membership = await OrganizationMember.findOne({
      userId,
      organizationId: requirement.organizationId,
      institutionId,
      role: "officer",
      status: "active"
    });

    if (!membership) {
      return res.status(403).json({ message: "You do not have permission to update this requirement" });
    }

    if (title !== undefined) requirement.title = title;
    if (description !== undefined) requirement.description = description;
    if (instructions !== undefined) requirement.instructions = instructions;
    if (requiredFiles !== undefined) requirement.requiredFiles = requiredFiles ? (Array.isArray(requiredFiles) ? requiredFiles : [requiredFiles]) : [];
    if (isMandatory !== undefined) requirement.isMandatory = isMandatory === "true" || isMandatory === true;
    if (isAnnouncement !== undefined) requirement.isAnnouncement = isAnnouncement === "true" || isAnnouncement === true;
    if (isActive !== undefined) requirement.isActive = isActive === "true" || isActive === true;
    if (dueDate !== undefined) requirement.dueDate = dueDate || undefined;
    if (points !== undefined) requirement.points = points || undefined;

    if (options !== undefined) {
      try {
        requirement.options = typeof options === 'string' ? JSON.parse(options) : options;
      } catch (e) {
        console.error("Failed to parse options for update", e);
      }
    }

    // Handle attachments update
    if (rawUrlAttachments !== undefined || (req.files && Array.isArray(req.files) && req.files.length > 0)) {
      let urlAttachments: any[] = [];
      if (rawUrlAttachments) {
        try {
          urlAttachments = JSON.parse(rawUrlAttachments);
        } catch (e) {
          console.error("Failed to parse URL attachments for update", e);
        }
      }
      
      let fileAttachments: any[] = [];
      if (req.files && Array.isArray(req.files)) {
        fileAttachments = req.files.map((file: any) => ({
          name: file.originalname,
          url: `/uploads/${file.filename}`,
          type: file.mimetype
        }));
      }
      
      if (rawUrlAttachments !== undefined) {
        // If they provided the attachments array (even if empty string "[]"), overwrite and append new files
        requirement.attachments = [...urlAttachments, ...fileAttachments];
      } else {
        // If they didn't provide rawUrlAttachments, but DID upload new files, append to existing
        requirement.attachments = [...(requirement.attachments || []), ...fileAttachments];
      }
    }

    await requirement.save();
    res.json({ message: "Requirement updated", requirement });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to update requirement" });
  }
};

export const deleteSignatoryRequirement = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;
    const { id } = req.params;

    const requirement = await ClearanceRequirement.findOne({ _id: id, institutionId });
    if (!requirement) return res.status(404).json({ message: "Requirement not found" });

    const membership = await OrganizationMember.findOne({
      userId,
      organizationId: requirement.organizationId,
      institutionId,
      role: "officer",
      status: "active"
    });

    if (!membership) {
      return res.status(403).json({ message: "You do not have permission to delete this requirement" });
    }

    await ClearanceRequirement.deleteOne({ _id: id });
    res.json({ message: "Requirement deleted" });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to delete requirement" });
  }
};

export const markAsOfficerCleared = async (req: Request, res: Response) => {
  try {
    const officerId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;
    const { organizationId, studentId } = req.params;
    const { signatureData } = req.body;

    if (!officerId || !institutionId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const membership = await OrganizationMember.findOne({
      userId: officerId,
      organizationId,
      institutionId,
      role: "officer",
      status: "active"
    });

    if (!membership) {
      return res.status(403).json({ message: "You do not have permission to mark students as cleared for this organization" });
    }

    const term = await Term.findOne({ institutionId, isActive: true });
    if (!term) return res.status(400).json({ message: "No active term found" });

    let clearanceRequest = await ClearanceRequest.findOne({
      userId: studentId,
      organizationId,
      institutionId,
      termId: term._id
    });

    if (!clearanceRequest) {
      // If student hasn't started the clearance process, create it initialized to 'officer_cleared'
      clearanceRequest = new ClearanceRequest({
        userId: studentId,
        organizationId,
        institutionId,
        termId: term._id,
        status: "officer_cleared",
        signatureUrl: signatureData
      });
    } else {
      if (clearanceRequest.status === "completed") {
        return res.status(400).json({ message: "Student is already fully cleared" });
      }
      clearanceRequest.status = "officer_cleared";
      if (signatureData) {
        clearanceRequest.signatureUrl = signatureData;
      }
    }

    await clearanceRequest.save();

    await AuditLog.create({
      userId: officerId,
      institutionId,
      action: "officer_marked_cleared",
      category: "clearance_workflow",
      resource: "ClearanceRequest",
      resourceId: clearanceRequest._id as any,
      details: { studentId },
      severity: "medium",
      ipAddress: req.ip || "unknown"
    });

    res.json({ message: "Student marked as cleared successfully", status: clearanceRequest.status });
  } catch (err: any) {
    console.error('Mark as officer cleared error:', err);
    res.status(500).json({ message: err.message || "Failed to mark student as cleared" });
  }
};
