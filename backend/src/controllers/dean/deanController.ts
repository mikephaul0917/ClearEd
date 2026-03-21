import { Request, Response } from "express";
import mongoose from "mongoose";
import ClearanceRequest from "../../models/ClearanceRequest";
import ClearanceSubmission from "../../models/ClearanceSubmission";
import ClearanceReview from "../../models/ClearanceReview";
import DeanAssignment from "../../models/DeanAssignment";
import StudentProfile from "../../models/StudentProfile";
import User from "../../models/User";
import Term from "../../models/Term";
import AuditLog from "../../models/AuditLog";

/**
 * List submissions ready for Dean review
 * Filters by Dean's assigned courses and year levels
 */
export const listDeanPending = async (req: Request, res: Response) => {
  try {
    const deanId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;

    if (!deanId || !institutionId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 1. Get Dean's Assignments
    const assignments = await DeanAssignment.find({ deanId, institutionId });
    if (assignments.length === 0) {
      return res.json({ rows: [] });
    }

    // 2. Get Active Term
    const term = await Term.findOne({ institutionId, isActive: true });
    if (!term) return res.json({ rows: [] });

    // 3. Find Submissions that are approved by an officer but need Dean review
    // or submissions for requirements that explicitly need Dean approval
    const submissions = await ClearanceSubmission.find({
      institutionId,
      status: "approved", // Already approved by officer
      // We look for those that haven't been reviewed by a dean yet
    }).populate("userId", "fullName email")
      .populate("clearanceRequirementId", "title description")
      .populate("organizationId", "name")
      .sort({ reviewedAt: 1 });

    // 4. Filter by Dean's Jurisdiction
    const filteredRows = [];
    for (const sub of submissions) {
      const studentProfile = await StudentProfile.findOne({
        userId: sub.userId,
        institutionId
      });

      if (!studentProfile) continue;

      const hasJurisdiction = assignments.some(a => {
        const courseMatch = a.course === "All" || a.course === studentProfile.course;
        const yearMatch = a.yearLevel === "All" || a.yearLevel === studentProfile.year;
        return courseMatch && yearMatch;
      });

      if (hasJurisdiction) {
        // Check if already reviewed by a dean
        const existingReview = await ClearanceReview.findOne({
          submissionId: sub._id,
          level: "dean"
        });

        if (!existingReview) {
          filteredRows.push({
            id: sub._id,
            studentName: (sub.userId as any).fullName,
            course: studentProfile.course,
            year: studentProfile.year,
            requirement: (sub.clearanceRequirementId as any).title,
            organization: (sub.organizationId as any).name,
            officerApprovedAt: sub.reviewedAt,
            files: sub.files
          });
        }
      }
    }

    res.json({ rows: filteredRows });
  } catch (err: any) {
    console.error('List dean pending error:', err);
    res.status(500).json({ message: err.message || "Failed to list submissions for dean review" });
  }
};

/**
 * Dean Final Approval for an entire Clearance Request
 */
export const approveFinalClearance = async (req: Request, res: Response) => {
  try {
    const deanId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;
    const { requestId } = req.params;

    if (!deanId || !institutionId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 1. Find the request
    const clearanceRequest = await ClearanceRequest.findOne({
      _id: requestId,
      institutionId
    });

    if (!clearanceRequest) {
      return res.status(404).json({ message: "Clearance request not found" });
    }

    // 2. Check Jurisdiction
    const studentProfile = await StudentProfile.findOne({
      userId: clearanceRequest.userId,
      institutionId
    });

    if (!studentProfile) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const assignments = await DeanAssignment.find({ deanId, institutionId });
    const hasJurisdiction = assignments.some(a => {
      const courseMatch = a.course === "All" || a.course === studentProfile.course;
      const yearMatch = a.yearLevel === "All" || a.yearLevel === studentProfile.year;
      return courseMatch && yearMatch;
    });

    if (!hasJurisdiction) {
      return res.status(403).json({ message: "You do not have jurisdiction over this student's course/year level" });
    }

    // 3. Verify the request is officer_cleared, and all submissions are approved
    if (clearanceRequest.status !== "officer_cleared") {
        return res.status(400).json({ message: "Cannot grant final approval. The organization officer has not marked this student as cleared." });
    }

    const pendingSubmissions = await ClearanceSubmission.countDocuments({
      clearanceRequestId: requestId,
      status: { $ne: "approved" }
    });

    if (pendingSubmissions > 0) {
      return res.status(400).json({ message: "Cannot grant final approval. Some requirements are still pending or rejected." });
    }

    // 4. Update request status
    clearanceRequest.status = "completed";
    clearanceRequest.finalApprovalDate = new Date();
    await clearanceRequest.save();

    // 5. Log Audit
    await AuditLog.create({
      userId: deanId,
      institutionId,
      action: 'clearance_final_approval_dean',
      resource: 'ClearanceRequest',
      resourceId: clearanceRequest._id,
      details: { studentId: clearanceRequest.userId },
      severity: 'high',
      category: 'clearance_workflow'
    });

    res.json({ message: "Final clearance approval granted" });

  } catch (err: any) {
    console.error('Dean final approval error:', err);
    res.status(500).json({ message: err.message || "Failed to process final approval" });
  }
};
