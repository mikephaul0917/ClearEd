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

    // 2. Get all active organizations for the institution
    const organizations = await Organization.find({
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
