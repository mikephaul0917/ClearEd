/**
 * Clearance request controller for student clearance workflow
 * Handles creation, tracking, and certificate generation for student clearances
 */

import { Request, Response } from "express";
import ClearanceRequest from "../models/ClearanceRequest";
import Organization from "../models/Organization";
import OrganizationMember from "../models/OrganizationMember";
import ClearanceRequirement from "../models/ClearanceRequirement";
import ClearanceSubmission from "../models/ClearanceSubmission";
import Term from "../models/Term";
import Institution from "../models/Institution";
import FinalClearance from "../models/FinalClearance";

/**
 * Start a new clearance request for a specific organization in the current active term
 * Verifies membership and organization status before creating the request
 */
export const startClearance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;
    const { organizationId } = req.body;

    if (!userId || !institutionId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!organizationId) {
      return res.status(400).json({ message: "Organization ID is required" });
    }

    // 1. Verify Organization exists and is active
    const organization = await Organization.findOne({
      _id: organizationId,
      institutionId,
      isActive: true
    });

    if (!organization) {
      return res.status(404).json({ message: "Active organization not found in your institution" });
    }

    // 2. Verify User is a member of the organization
    const membership = await OrganizationMember.findOne({
      userId,
      organizationId,
      status: "active"
    });

    if (!membership) {
      return res.status(403).json({ message: "You are not an active member of this organization" });
    }

    // 3. Get active term for the institution
    const term = await Term.findOne({ institutionId, isActive: true });
    if (!term) {
      return res.status(400).json({ message: "No active academic term found for your institution" });
    }

    // 4. Check for existing request
    const existing = await ClearanceRequest.findOne({
      userId,
      organizationId,
      termId: term._id
    });

    if (existing) {
      return res.status(400).json({ message: "Clearance already started for this organization in the current term" });
    }

    // 5. Create the clearance request
    const request = await ClearanceRequest.create({
      userId,
      organizationId,
      institutionId,
      termId: term._id,
      status: "pending",
      submittedAt: new Date()
    });

    res.status(201).json({
      message: "Clearance workflow started",
      request
    });

  } catch (error: any) {
    console.error('Start clearance error:', error);
    res.status(500).json({
      message: "Failed to start clearance",
      error: error.message
    });
  }
};

/**
 * Get clearance timeline showing status across all requirements in an organization
 * Aggregates requirements and submissions for a comprehensive view
 */
export const getTimeline = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;
    const { organizationId } = req.params;

    if (!userId || !institutionId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 1. Find the clearance request
    const request = await ClearanceRequest.findOne({
      userId,
      organizationId,
      institutionId
    }).populate("termId", "name academicYear");

    if (!request) {
      return res.status(404).json({ message: "No active clearance request found for this organization" });
    }

    // 2. Fetch all requirements for this organization
    const requirements = await ClearanceRequirement.find({
      organizationId,
      isActive: true
    }).sort({ order: 1 });

    // 3. Fetch all submissions for this request
    const submissions = await ClearanceSubmission.find({
      clearanceRequestId: request._id,
      userId
    });

    // 4. Map requirements to their submission status
    const timeline = requirements.map(reqItem => {
      const submission = submissions.find(s => s.clearanceRequirementId.toString() === (reqItem as any)._id.toString());

      return {
        requirementId: reqItem._id,
        title: reqItem.title,
        description: reqItem.description,
        status: submission ? submission.status : "pending_submission",
        submittedAt: submission ? submission.submittedAt : null,
        reviewedAt: submission ? submission.reviewedAt : null,
        notes: submission ? submission.notes : ""
      };
    });

    res.json({
      requestStatus: request.status,
      term: request.termId,
      items: timeline
    });

  } catch (error: any) {
    console.error('Get timeline error:', error);
    res.status(500).json({
      message: "Failed to fetch clearance timeline",
      error: error.message
    });
  }
};

/**
 * Get all active organizations in the institution and the student's clearance status for each
 */
export const getMyClearances = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;

    if (!userId || !institutionId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 1. Get current active term
    const term = await Term.findOne({ institutionId, isActive: true });
    if (!term) return res.json({ organizations: [] });

    // 2. Get all organizations the student is an active member of
    const memberships = await OrganizationMember.find({
      userId,
      institutionId,
      status: 'active'
    });
    const joinedOrgIds = memberships.map(m => m.organizationId);

    // 2.5 Get all active organizations for the institution that the student joined
    const organizations = await Organization.find({
      _id: { $in: joinedOrgIds },
      institutionId,
      isActive: true,
      status: 'active'
    }).sort({ order: 1 });

    // 3. Get all clearance requests for this user in this term
    const requests = await ClearanceRequest.find({
      userId,
      institutionId,
      termId: term._id
    });
    
    // 3.5 Fetch institution details
    const institution = await Institution.findById(institutionId);

    // 3.8 Fetch any FinalClearance
    const finalClearance = await FinalClearance.findOne({
      userId,
      institutionId,
      termId: term._id
    });

    // 4. Map organizations to their clearance status
    const data = organizations.map((org: any) => {
      const request = requests.find(r => r.organizationId.toString() === org._id.toString());
      return {
        _id: org._id,
        name: org.name,
        code: org.code,
        signatoryName: org.signatoryName,
        isFinal: org.isFinal,
        status: request ? request.status : "not_started",
        submittedAt: request ? request.submittedAt : null,
        signatureUrl: request ? (request as any).signatureUrl : undefined
      };
    });

    res.json({
      term: { name: term.name, academicYear: term.academicYear },
      institution: {
        name: institution?.name,
        address: institution?.address,
        department: (institution as any)?.department,
        region: (institution as any)?.region,
        division: (institution as any)?.division
      },
      finalClearance: finalClearance ? { status: finalClearance.status, submittedAt: finalClearance.submittedAt, signatureUrl: finalClearance.signatureUrl } : null,
      organizations: data
    });

  } catch (error: any) {
    console.error('Get my clearances error:', error);
    res.status(500).json({ message: "Failed to fetch clearances", error: error.message });
  }
};

/**
 * Generate clearance certificate (Placeholder)
 */
export const getCertificate = async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/pdf");
  res.send(Buffer.from("Clearance Certificate - Requirement validation pending implementation"));
};

/**
 * Submit all completed clearances to the Dean for final approval
 */
export const submitToDean = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;

    if (!userId || !institutionId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 1. Get current active term
    const term = await Term.findOne({ institutionId, isActive: true });
    if (!term) return res.status(400).json({ message: "No active academic term found" });

    // 2. Check if already submitted
    const existing = await FinalClearance.findOne({
      userId,
      institutionId,
      termId: term._id
    });
    if (existing) {
      return res.status(400).json({ message: "You have already submitted your clearance to the Dean." });
    }

    // 3. Find all organizations the user is a member of
    const memberships = await OrganizationMember.find({
      userId,
      status: "active"
    });

    if (memberships.length === 0) {
       // Might be edge case where student is in no organizations
       return res.status(400).json({ message: "You belong to no organizations, nothing to submit." });
    }

    // 4. Verify all required requests have been completed or officer_cleared
    const requests = await ClearanceRequest.find({
      userId,
      institutionId,
      termId: term._id
    });

    for (const membership of memberships) {
      const request = requests.find(r => r.organizationId.toString() === membership.organizationId.toString());
      if (!request) {
        return res.status(400).json({ message: "You have not started clearance for all your organizations." });
      }
      if (request.status !== "officer_cleared" && request.status !== "completed") {
        return res.status(400).json({ message: "All organization clearances must be cleared by officers before submitting to Dean." });
      }
    }

    // 5. Create Final Clearance
    const finalClearance = await FinalClearance.create({
      userId,
      institutionId,
      termId: term._id,
      status: "pending",
      submittedAt: new Date()
    });

    res.status(201).json({
      message: "Successfully submitted to Dean for final approval",
      finalClearance
    });

  } catch (error: any) {
    console.error('Submit to dean error:', error);
    res.status(500).json({ message: "Failed to submit clearance to Dean", error: error.message });
  }
};
