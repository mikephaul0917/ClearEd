import { Request, Response } from "express";
import mongoose from "mongoose";
import ClearanceRequest from "../../models/ClearanceRequest";
import ClearanceSubmission from "../../models/ClearanceSubmission";
import ClearanceReview from "../../models/ClearanceReview";
import OrganizationMember from "../../models/OrganizationMember";
import ClearanceRequirement from "../../models/ClearanceRequirement";
import User from "../../models/User";
import Term from "../../models/Term";
import FinalClearance from "../../models/FinalClearance";
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

    if (!['approved', 'rejected', 'pending'].includes(decision)) {
      return res.status(400).json({ message: "Invalid decision. Must be 'approved', 'rejected', or 'pending'" });
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

    // 3. Update or Create Review Record
    const review = await ClearanceReview.findOneAndUpdate(
      { 
        submissionId, 
        level: role === 'dean' ? 'dean' : 'officer' 
      },
      {
        submissionId,
        reviewerId,
        decision,
        level: role === 'dean' ? 'dean' : 'officer',
        remarks,
        institutionId
      },
      { upsert: true, new: true, runValidators: true }
    );

    // 4. Update Submission Status
    submission.status = decision;
    submission.reviewedBy = reviewerId;
    submission.reviewedAt = new Date();
    submission.notes = remarks;
    await submission.save();

    // 5. Log Action
    await AuditLog.create({
      userId: reviewerId,
      institutionId,
      action: decision === 'approved' ? 'clearance_approved' : 
              decision === 'rejected' ? 'clearance_rejected' : 'clearance_revoked',
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
 * Bulk review multiple clearance submissions
 */
export const bulkReviewSubmissions = async (req: Request, res: Response) => {
  try {
    const reviewerId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;
    const role = (req as any).user?.role;
    const { submissionIds, decision, remarks } = req.body;

    if (!reviewerId || !institutionId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return res.status(400).json({ message: "No submissions selected" });
    }

    if (!['approved', 'rejected', 'pending'].includes(decision)) {
      return res.status(400).json({ message: "Invalid decision" });
    }

    // Find all relevant submissions
    const submissions = await ClearanceSubmission.find({
      _id: { $in: submissionIds },
      institutionId
    });

    const results = [];
    for (const submission of submissions) {
      // Verify authority for the organization of this submission
      const membership = await OrganizationMember.findOne({
        userId: reviewerId,
        organizationId: submission.organizationId,
        role: "officer",
        status: "active"
      });

      if (!membership && role !== 'admin' && role !== 'super_admin') {
        continue;
      }

      // Update or Create Review Record
      await ClearanceReview.findOneAndUpdate(
        { 
          submissionId: submission._id, 
          level: role === 'dean' ? 'dean' : 'officer' 
        },
        {
          submissionId: submission._id,
          reviewerId,
          decision,
          level: role === 'dean' ? 'dean' : 'officer',
          remarks,
          institutionId
        },
        { upsert: true, runValidators: true }
      );

      // Update Submission
      submission.status = decision;
      submission.reviewedBy = reviewerId;
      submission.reviewedAt = new Date();
      submission.notes = remarks;
      await submission.save();

      results.push(submission._id);
    }

    if (results.length > 0) {
      await AuditLog.create({
        userId: reviewerId,
        institutionId,
        action: decision === 'approved' ? 'clearance_approved_bulk' : 
                decision === 'rejected' ? 'clearance_rejected_bulk' : 'clearance_revoked_bulk',
        category: 'clearance_workflow',
        resource: 'ClearanceSubmission',
        details: {
          decision,
          count: results.length,
          submissionIds: results
        },
        severity: 'medium',
        ipAddress: req.ip || 'unknown'
      });
    }

    res.json({
      message: `Successfully processed ${results.length} submissions`,
      processedCount: results.length
    });
  } catch (err: any) {
    console.error('Bulk review error:', err);
    res.status(500).json({ message: err.message || "Failed to process bulk review" });
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
    const { title, description, instructions, requiredFiles, isMandatory, isAnnouncement, isActive, isReviewed, attachments: rawUrlAttachments, options, dueDate, points } = req.body;

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
    if (isReviewed !== undefined) requirement.isReviewed = isReviewed === "true" || isReviewed === true;

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
      const officer = await User.findById(officerId);
      clearanceRequest = new ClearanceRequest({
        userId: studentId,
        organizationId,
        institutionId,
        termId: term._id,
        status: "officer_cleared",
        signatureUrl: signatureData || officer?.signatureUrl,
        officerId: officerId, // Set officerId here
        finalApprovalDate: new Date() // Set finalApprovalDate here
      });
    } else {
      if (clearanceRequest.status === "completed") {
        return res.status(400).json({ message: "Student is already fully cleared" });
      }
      clearanceRequest.status = "officer_cleared";
      clearanceRequest.officerId = officerId; // Set officerId here
      clearanceRequest.finalApprovalDate = new Date(); // Set finalApprovalDate here
      if (signatureData) {
        clearanceRequest.signatureUrl = signatureData;
      } else if (!clearanceRequest.signatureUrl) {
        // Only fallback if the request doesn't already have a signature
        const officer = await User.findById(officerId);
        if (officer?.signatureUrl) {
          clearanceRequest.signatureUrl = officer.signatureUrl;
        }
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

export const bulkMarkAsOfficerCleared = async (req: Request, res: Response) => {
  try {
    const officerId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;
    const { organizationId } = req.params;
    const { studentIds, signatureData } = req.body;

    if (!officerId || !institutionId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "No students selected" });
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

    const officer = await User.findById(officerId);
    const finalSignature = signatureData || officer?.signatureUrl;

    const results = [];

    for (const studentId of studentIds) {
      let clearanceRequest = await ClearanceRequest.findOne({
        userId: studentId,
        organizationId,
        institutionId,
        termId: term._id
      });

      if (!clearanceRequest) {
        clearanceRequest = new ClearanceRequest({
          userId: studentId,
          organizationId,
          institutionId,
          termId: term._id,
          status: "officer_cleared",
          signatureUrl: finalSignature,
          officerId: officerId,
          finalApprovalDate: new Date()
        });
      } else {
        if (clearanceRequest.status === "completed") continue;
        
        clearanceRequest.status = "officer_cleared";
        clearanceRequest.officerId = officerId;
        clearanceRequest.finalApprovalDate = new Date();
        if (finalSignature) {
          clearanceRequest.signatureUrl = finalSignature;
        }
      }

      await clearanceRequest.save();
      results.push(studentId);

      await AuditLog.create({
        userId: officerId,
        institutionId,
        action: "officer_marked_cleared",
        category: "clearance_workflow",
        resource: "ClearanceRequest",
        resourceId: clearanceRequest._id as any,
        details: { studentId, batch: true },
        severity: "medium",
        ipAddress: req.ip || "unknown"
      });
    }

    res.json({ 
      message: `Successfully cleared ${results.length} students`, 
      clearedCount: results.length 
    });
  } catch (err: any) {
    console.error('Bulk mark as officer cleared error:', err);
    res.status(500).json({ message: err.message || "Failed to process bulk clearance" });
  }
};

export const revokeOfficerClearance = async (req: Request, res: Response) => {
  try {
    const officerId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;
    const { organizationId, studentId } = req.params;

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
      return res.status(403).json({ message: "You do not have permission to revoke clearance for this organization" });
    }

    const term = await Term.findOne({ institutionId, isActive: true });
    if (!term) return res.status(400).json({ message: "No active term found" });

    // Check if Final Clearance is already approved
    const finalClearance = await FinalClearance.findOne({
      userId: studentId,
      institutionId,
      termId: term._id,
      status: 'approved'
    });

    if (finalClearance) {
      return res.status(400).json({ message: "Cannot revoke: Final Clearance has already been approved by the Dean." });
    }

    const clearanceRequest = await ClearanceRequest.findOne({
      userId: studentId,
      organizationId,
      institutionId,
      termId: term._id
    });

    if (!clearanceRequest) {
      return res.status(404).json({ message: "Clearance record not found" });
    }

    clearanceRequest.status = "in_progress";
    clearanceRequest.signatureUrl = undefined;
    clearanceRequest.officerId = undefined;
    clearanceRequest.finalApprovalDate = undefined;

    await clearanceRequest.save();

    await AuditLog.create({
      userId: officerId,
      institutionId,
      action: "officer_revoked_clearance",
      category: "clearance_workflow",
      resource: "ClearanceRequest",
      resourceId: clearanceRequest._id as any,
      details: { studentId },
      severity: "medium",
      ipAddress: req.ip || "unknown"
    });

    res.json({ message: "Clearance revoked successfully", status: clearanceRequest.status });
  } catch (err: any) {
    console.error('Revoke officer clearance error:', err);
    res.status(500).json({ message: err.message || "Failed to revoke clearance" });
  }
};

export const bulkRevokeOfficerClearance = async (req: Request, res: Response) => {
  try {
    const officerId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;
    const { organizationId } = req.params;
    const { studentIds } = req.body;

    if (!officerId || !institutionId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "No students selected" });
    }

    const membership = await OrganizationMember.findOne({
      userId: officerId,
      organizationId,
      institutionId,
      role: "officer",
      status: "active"
    });

    if (!membership) {
      return res.status(403).json({ message: "You do not have permission to revoke clearance for this organization" });
    }

    const term = await Term.findOne({ institutionId, isActive: true });
    if (!term) return res.status(400).json({ message: "No active term found" });

    const results = [];
    const skipped = [];

    for (const studentId of studentIds) {
      // Check if Final Clearance is already approved
      const finalClearance = await FinalClearance.findOne({
        userId: studentId,
        institutionId,
        termId: term._id,
        status: 'approved'
      });

      if (finalClearance) {
        skipped.push(studentId);
        continue;
      }

      const clearanceRequest = await ClearanceRequest.findOne({
        userId: studentId,
        organizationId,
        institutionId,
        termId: term._id
      });

      if (!clearanceRequest) continue;

      clearanceRequest.status = "in_progress";
      clearanceRequest.signatureUrl = undefined;
      clearanceRequest.officerId = undefined;
      clearanceRequest.finalApprovalDate = undefined;

      await clearanceRequest.save();
      results.push(studentId);

      await AuditLog.create({
        userId: officerId,
        institutionId,
        action: "officer_revoked_clearance",
        category: "clearance_workflow",
        resource: "ClearanceRequest",
        resourceId: clearanceRequest._id as any,
        details: { studentId, batch: true },
        severity: "medium",
        ipAddress: req.ip || "unknown"
      });
    }

    res.json({ 
      message: `Successfully revoked clearance for ${results.length} students. ${skipped.length > 0 ? skipped.length + ' skipped (already approved by Dean).' : ''}`, 
      revokedCount: results.length,
      skippedCount: skipped.length
    });
  } catch (err: any) {
    console.error('Bulk revoke officer clearance error:', err);
    res.status(500).json({ message: err.message || "Failed to process bulk revocation" });
  }
};
