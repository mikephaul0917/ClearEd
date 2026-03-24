import { Request, Response } from "express";
import mongoose from "mongoose";
import ClearanceSubmission from "../models/ClearanceSubmission";
import ClearanceRequirement from "../models/ClearanceRequirement";
import ClearanceRequest from "../models/ClearanceRequest";
import Organization from "../models/Organization";
import AuditLog from "../models/AuditLog";
import { logAudit } from "../utils/auditLogger";
import { AppError, catchAsync } from "../utils/errors";

/**
 * Submit a clearance requirement evidence/file.
 * Logic:
 * - Upserts submission for the specific requirement.
 * - Links to the parent ClearanceRequest.
 * - Handles resubmissions of rejected items.
 */
export const submitRequirement = catchAsync(async (req: Request, res: Response) => {
    const { requirementId, studentNotes, files } = req.body;
    const userId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;

    if (!requirementId) {
        throw new AppError("Requirement ID is required.", 400);
    }

    if (!institutionId) {
        throw new AppError("Institution context is required.", 401);
    }

    // 1. Fetch Requirement & Organization
    const requirement = await ClearanceRequirement.findOne({
        _id: requirementId,
        institutionId,
        isActive: true
    });

    if (!requirement) {
        throw new AppError("Requirement not found, inactive, or belongs to another institution.", 404);
    }

    const organization = await Organization.findById(requirement.organizationId);
    if (!organization) {
        throw new AppError("Associated organization not found.", 404);
    }

    // 2. Find or Create parent ClearanceRequest for this term/org
    let clearanceRequest = await ClearanceRequest.findOne({
        userId,
        organizationId: requirement.organizationId,
        termId: organization.termId
    });

    if (!clearanceRequest) {
        clearanceRequest = await ClearanceRequest.create({
            userId,
            organizationId: requirement.organizationId,
            institutionId,
            termId: organization.termId,
            status: "in_progress"
        });
    } else if (clearanceRequest.status === 'pending') {
        clearanceRequest.status = 'in_progress';
        await clearanceRequest.save();
    }

    // 3. Upsert Submission
    let submission = await ClearanceSubmission.findOne({
        userId,
        clearanceRequirementId: requirementId,
        clearanceRequestId: clearanceRequest._id
    });

    if (submission) {
        // PREVENT DUPLICATE SUBMISSION: Only allow updates if pending or rejected
        if (submission.status === 'approved') {
            throw new AppError("This requirement has already been approved and cannot be resubmitted.", 400);
        }

        submission.files = files || submission.files;
        submission.studentNotes = studentNotes || submission.studentNotes;
        submission.status = "pending";
        submission.submittedAt = new Date();
        submission.lastResubmittedAt = new Date();
        await submission.save();
    } else {
        submission = await ClearanceSubmission.create({
            userId,
            clearanceRequirementId: requirementId,
            clearanceRequestId: clearanceRequest._id,
            organizationId: requirement.organizationId,
            institutionId,
            files: files || [],
            studentNotes,
            status: "pending",
            submittedAt: new Date()
        });
    }

    // 4. Log Action
    await logAudit({
        userId,
        institutionId,
        action: 'CLEARANCE_SUBMISSION_UPDATED',
        category: 'clearance_workflow',
        resource: 'ClearanceSubmission',
        resourceId: submission._id as any,
        details: {
            requirementId,
            title: requirement.title,
            orgId: requirement.organizationId
        },
        severity: 'low',
        req
    });

    res.status(200).json({
        status: 'success',
        message: "Submission received successfully.",
        submission
    });
});

/**
 * Get student's To-Do list across all organizations.
 */
export const getStudentTodoList = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;

    if (!institutionId) {
        throw new AppError("Institution context is required.", 401);
    }

    // 1. Get all organizations where the user is a member
    const memberships = await mongoose.model('OrganizationMember').find({
        userId,
        institutionId,
        status: 'active'
    });

    const organizationIds = memberships.map(m => m.organizationId);

    // 2. Get all active requirements for these organizations
    const requirements = await ClearanceRequirement.find({
        organizationId: { $in: organizationIds },
        isActive: true
    }).populate('organizationId', 'name').populate('officeId', 'name');

    // 3. Get all submissions by the user
    const submissions = await ClearanceSubmission.find({ userId });

    // 4. Map requirements to their submission status
    const todoItems = requirements.map((reqObj: any) => {
        const submission = submissions.find(s =>
            s.clearanceRequirementId.toString() === reqObj._id.toString()
        );

        const status = submission ? submission.status : 'not_started';

        const now = new Date();

        return {
            requirement: {
                id: reqObj._id,
                title: reqObj.title,
                description: reqObj.description,
                isMandatory: reqObj.isMandatory,
                organizationId: reqObj.organizationId?._id,
                organization: reqObj.organizationId?.name,
                office: reqObj.officeId?.name,
                dueDate: reqObj.dueDate
            },
            status,
            submissionId: submission ? submission._id : null,
            submittedAt: submission ? submission.submittedAt : null,
            rejectionReason: submission ? submission.rejectionReason : null
        };
    });

    const now = new Date();

    res.json({
        status: 'success',
        todoList: {
            assigned: todoItems.filter(item => {
                // Assigned: not completed, and either no due date OR due date is in the future/present
                const isNotCompleted = ['not_started', 'rejected', 'resubmission_required'].includes(item.status);
                const isNotMissing = !item.requirement.dueDate || new Date(item.requirement.dueDate) >= now;
                return isNotCompleted && isNotMissing;
            }),
            missing: todoItems.filter(item => {
                // Missing: not completed, and has a due date in the past
                const isNotCompleted = ['not_started', 'rejected', 'resubmission_required'].includes(item.status);
                const isMissing = item.requirement.dueDate && new Date(item.requirement.dueDate) < now;
                return isNotCompleted && isMissing;
            }),
            done: todoItems.filter(item => {
                // Done: pending or approved
                return item.status === 'approved' || item.status === 'pending';
            })
        }
    });
});
