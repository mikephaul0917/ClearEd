import { Request, Response } from "express";
import ClearanceRequest from "../../models/ClearanceRequest";
import ClearanceSubmission from "../../models/ClearanceSubmission";
import DeanAssignment from "../../models/DeanAssignment";
import StudentProfile from "../../models/StudentProfile";
import OrganizationMember from "../../models/OrganizationMember";
import User from "../../models/User";
import Term from "../../models/Term";
import AuditLog from "../../models/AuditLog";
import FinalClearance from "../../models/FinalClearance";
import ClearanceRequirement from "../../models/ClearanceRequirement";

export const getFinalReadySubmissions = async (req: Request, res: Response) => {
  try {
    const deanId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;

    if (!deanId || !institutionId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const assignments = await DeanAssignment.find({ deanId, institutionId });
    if (assignments.length === 0) return res.json({ rows: [] });

    const term = await Term.findOne({ institutionId, isActive: true });
    if (!term) return res.json({ rows: [] });

    const { status = "pending" } = req.query;
    const pendingFinals = await FinalClearance.find({
      institutionId,
      termId: term._id,
      status: status as string
    }).populate("userId", "fullName email avatarUrl");

    const rows = [];
    for (const final of pendingFinals) {
      const studentProfile = await StudentProfile.findOne({
        userId: final.userId,
        institutionId
      });

      if (!studentProfile) continue;

      const hasJurisdiction = assignments.some(a => {
        const courseMatch = a.course === "All" || a.course === studentProfile.course;
        const yearMatch = a.yearLevel === "All" || a.yearLevel === studentProfile.year;
        return courseMatch && yearMatch;
      });

      if (hasJurisdiction) {
        // Calculate reqCompleted vs reqTotal
        const memberships = await OrganizationMember.find({ userId: final.userId, status: "active" }).populate("organizationId", "name code");
        const numTotal = memberships.length;
        
        const requests = await ClearanceRequest.find({ userId: final.userId, termId: term._id, institutionId });
        const numCompleted = requests.filter(r => r.status === 'officer_cleared' || r.status === 'completed').length;

        const orgs = memberships.map(m => {
          const req = requests.find(r => r.organizationId.toString() === (m.organizationId as any)._id.toString());
          return {
            name: (m.organizationId as any).name,
            status: req ? req.status : "pending",
            signatureUrl: req ? req.signatureUrl : null,
          };
        });

        rows.push({
          id: final._id,
          name: (final.userId as any).fullName,
          avatarUrl: (final.userId as any).avatarUrl,
          studentId: final.userId._id, // User ID needed for approval payload
          studentNumber: studentProfile.studentNumber || (final.userId as any).username,
          course: studentProfile.course,
          year: studentProfile.year,
          dateSubmitted: final.submittedAt.toISOString().slice(0, 10),
          dateApproved: final.reviewedAt ? final.reviewedAt.toISOString().slice(0, 10) : null,
          reqCompleted: numCompleted,
          reqTotal: numTotal,
          organizations: orgs
        });
      }
    }

    res.json({ rows });
  } catch (err: any) {
    console.error("error in getFinalReadySubmissions", err);
    res.status(500).json({ message: "Failed to list final ready submissions" });
  }
};

export const listOrganizationPending = async (req: Request, res: Response) => {
  try {
    const deanId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;

    if (!deanId || !institutionId) return res.status(401).json({ message: "Unauthorized" });

    const assignments = await DeanAssignment.find({ deanId, institutionId });
    if (assignments.length === 0) return res.json({ rows: [] });

    const term = await Term.findOne({ institutionId, isActive: true });
    if (!term) return res.json({ rows: [] });

    // Let's just return ClearanceRequests that are pending/in_progress but belong to students in dean's jurisdiction
    const pendingReqs = await ClearanceRequest.find({
      institutionId,
      termId: term._id,
    }).populate("userId", "fullName email avatarUrl");

    const rows = [];
    const processedStudentIds = new Set<string>();

    for (const req of pendingReqs) {
       const uId = req.userId._id.toString();
       if (processedStudentIds.has(uId)) continue;
       
       const studentProfile = await StudentProfile.findOne({ userId: req.userId, institutionId });
       if (!studentProfile) continue;

       const hasJurisdiction = assignments.some(a => {
        const courseMatch = a.course === "All" || a.course === studentProfile.course;
        const yearMatch = a.yearLevel === "All" || a.yearLevel === studentProfile.year;
        return courseMatch && yearMatch;
       });

       if (hasJurisdiction) {
         processedStudentIds.add(uId);

         const memberships = await OrganizationMember.find({ userId: req.userId, status: "active" }).populate("organizationId", "name code");
         const numTotal = memberships.length;
         const allRequests = await ClearanceRequest.find({ userId: req.userId, termId: term._id });
         const numCompleted = allRequests.filter(r => r.status === 'officer_cleared' || r.status === 'completed').length;

         const orgs = memberships.map((m: any) => {
           const r = allRequests.find((reqst: any) => reqst.organizationId.toString() === m.organizationId._id.toString());
           return {
             name: m.organizationId.name,
             status: r ? r.status : "pending",
             signatureUrl: r ? r.signatureUrl : null,
           };
         });

         rows.push({
           id: req._id,
           name: (req.userId as any).fullName,
           studentId: req.userId._id,
           course: studentProfile.course,
           year: studentProfile.year,
           dateSubmitted: (req.submittedAt || req.createdAt).toISOString().slice(0, 10),
           status: "Pending",
           reqCompleted: numCompleted,
           reqTotal: numTotal,
           organizations: orgs
         });
       }
    }

    res.json({ rows });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch organization pending" });
  }
}

export const approveFinalClearance = async (req: Request, res: Response) => {
  try {
    const deanId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;
    const { studentId, signatureUrl } = req.body;

    if (!deanId || !institutionId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const term = await Term.findOne({ institutionId, isActive: true });
    if (!term) return res.status(400).json({ message: "No active academic term found" });

    const studentProfile = await StudentProfile.findOne({
      userId: studentId,
      institutionId
    });

    if (!studentProfile) return res.status(404).json({ message: "Student profile not found" });

    const assignments = await DeanAssignment.find({ deanId, institutionId });
    const hasJurisdiction = assignments.some(a => {
      const courseMatch = a.course === "All" || a.course === studentProfile.course;
      const yearMatch = a.yearLevel === "All" || a.yearLevel === studentProfile.year;
      return courseMatch && yearMatch;
    });

    if (!hasJurisdiction) return res.status(403).json({ message: "No jurisdiction" });

    // Approve FinalClearance
    const finalClearance = await FinalClearance.findOne({
      userId: studentId,
      institutionId,
      termId: term._id,
      status: "pending"
    });

    if (!finalClearance) {
      return res.status(404).json({ message: "Final clearance pending submission not found" });
    }

    finalClearance.status = "approved";
    finalClearance.reviewedBy = deanId;
    finalClearance.reviewedAt = new Date();
    if (signatureUrl) {
      finalClearance.signatureUrl = signatureUrl;
    } else {
      // Fallback to Dean's profile signature
      const dean = await User.findById(deanId);
      if (dean?.signatureUrl) {
        finalClearance.signatureUrl = dean.signatureUrl;
      }
    }
    await finalClearance.save();

    // Also update all ClearanceRequests to "completed"
    await ClearanceRequest.updateMany({
      userId: studentId,
      institutionId,
      termId: term._id,
      status: "officer_cleared"
    }, {
      $set: { status: "completed", finalApprovalDate: new Date() }
    });

    await AuditLog.create({
      userId: deanId,
      institutionId,
      action: 'clearance_final_approval_dean',
      resource: 'FinalClearance',
      resourceId: finalClearance._id,
      details: { studentId },
      severity: 'high',
      category: 'clearance_workflow'
    });

    res.json({ message: "Final clearance approved successfully!" });

  } catch (err: any) {
    res.status(500).json({ message: "Failed to process final approval", error: err.message });
  }
};

export const getAssignedCourses = async (req: Request, res: Response) => {
  try {
    const institutionId = (req as any).user?.institutionId;
    if (!institutionId) return res.status(401).json({ message: "Unauthorized" });

    const courses = await DeanAssignment.distinct("course", { institutionId, course: { $ne: "All" } });
    res.json({ courses: courses.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch assigned courses" });
  }
};
