import { Request, Response } from "express";
import mongoose from "mongoose";
import ClearanceSubmission from "../models/ClearanceSubmission";
import ClearanceRequirement from "../models/ClearanceRequirement";
import ClearanceOffice from "../models/ClearanceOffice";
import ClearanceRequest from "../models/ClearanceRequest";
import OrganizationMember from "../models/OrganizationMember";
import { logAudit } from "../utils/auditLogger";
import { AppError, catchAsync } from "../utils/errors";

/**
 * Review a student's clearance submission.
 * Enforces:
 * - Selective permissions (Officer of the specific org/office or Admin)
 * - Approval sequence (must clear lower sequence offices first)
 * - Mandatory remarks for rejections
 * - Transaction-safe updates
 */
export const reviewSubmission = catchAsync(async (req: Request, res: Response) => {
    const { submissionId, status, notes, rejectionReason } = req.body;
    const reviewerId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;
    const reviewerRole = (req as any).user?.role;

    if (!submissionId || !status) {
        throw new AppError("Submission ID and status are required.", 400);
    }

    if (!['approved', 'rejected', 'resubmission_required'].includes(status)) {
        throw new AppError("Invalid status. Supported statuses: approved, rejected, resubmission_required.", 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Fetch Submission and Requirements
        const submission = await ClearanceSubmission.findById(submissionId)
            .populate('clearanceRequirementId')
            .session(session);

        if (!submission) {
            throw new AppError("Submission not found.", 404);
        }

        // Institution Isolation Check
        if (submission.institutionId.toString() !== institutionId.toString() && reviewerRole !== 'super_admin') {
            throw new AppError("Access denied. Submission belongs to another institution.", 403);
        }

        const requirement = submission.clearanceRequirementId as any;

        // 2. Permission Check
        let isAuthorized = reviewerRole === 'super_admin' || reviewerRole === 'admin';

        if (!isAuthorized) {
            // Check if requester is an officer in this organization
            const membership = await OrganizationMember.findOne({
                organizationId: submission.organizationId,
                userId: reviewerId,
                role: "officer",
                status: "active"
            }).session(session);

            if (membership) isAuthorized = true;
        }

        if (!isAuthorized) {
            throw new AppError("You don't have permission to review this submission.", 403);
        }

        // 3. Handle Rejection
        if (status === 'rejected' || status === 'resubmission_required') {
            if (!rejectionReason) {
                throw new AppError("Rejection reason is required for rejected or resubmission_required status.", 400);
            }

            submission.status = status;
            submission.rejectionReason = rejectionReason;
            submission.notes = notes;
            submission.reviewedBy = reviewerId;
            submission.reviewedAt = new Date();
            await submission.save({ session });

            await logAudit({
                userId: reviewerId,
                institutionId,
                action: 'CLEARANCE_SUBMISSION_REJECTED',
                category: 'clearance_workflow',
                resource: 'ClearanceSubmission',
                resourceId: submission._id as any,
                details: { rejectionReason, requirementTitle: requirement.title },
                severity: 'medium',
                req,
                session
            });

            await session.commitTransaction();
            return res.json({ message: "Submission rejected successfully.", submission });
        }

        // 4. Handle Approval (Sequence Check)
        if (status === 'approved') {
            const currentOfficeId = requirement.officeId;

            if (currentOfficeId) {
                const currentOffice = await ClearanceOffice.findById(currentOfficeId).session(session);

                if (currentOffice && currentOffice.sequence > 1) {
                    // Find all offices with LOWER sequence in the same institution
                    const previousOffices = await ClearanceOffice.find({
                        institutionId,
                        sequence: { $lt: currentOffice.sequence },
                        isActive: true
                    }).session(session);

                    const previousOfficeIds = previousOffices.map(o => o._id);

                    if (previousOfficeIds.length > 0) {
                        // Find all mandatory requirements for this organization belonging to lower sequence offices
                        const previousRequirements = await ClearanceRequirement.find({
                            organizationId: submission.organizationId,
                            officeId: { $in: previousOfficeIds },
                            isActive: true,
                            isMandatory: true
                        }).session(session);

                        const previousRequirementIds = previousRequirements.map(r => r._id);

                        // Check if ALL mandatory requirements from lower sequence offices are approved
                        if (previousRequirementIds.length > 0) {
                            const approvedCount = await ClearanceSubmission.countDocuments({
                                userId: submission.userId,
                                clearanceRequestId: submission.clearanceRequestId,
                                clearanceRequirementId: { $in: previousRequirementIds },
                                status: 'approved'
                            }).session(session);

                            if (approvedCount < previousRequirementIds.length) {
                                throw new AppError(
                                    `Approval Denied: Student must clear previous offices (e.g., Library/Finance) before this office (${currentOffice.name}).`,
                                    400
                                );
                            }
                        }
                    }
                }
            }

            submission.status = 'approved';
            submission.notes = notes;
            submission.reviewedBy = reviewerId;
            submission.reviewedAt = new Date();
            await submission.save({ session });

            await logAudit({
                userId: reviewerId,
                institutionId,
                action: 'CLEARANCE_SUBMISSION_APPROVED',
                category: 'clearance_workflow',
                resource: 'ClearanceSubmission',
                resourceId: submission._id as any,
                details: { requirementTitle: requirement.title },
                severity: 'low',
                req,
                session
            });

            // Check if ALL mandatory requirements for this request are approved
            const allMandatoryRequirements = await ClearanceRequirement.find({
                organizationId: submission.organizationId,
                isActive: true,
                isMandatory: true
            }).session(session);

            const approvedSubmissionsCount = await ClearanceSubmission.countDocuments({
                clearanceRequestId: submission.clearanceRequestId,
                status: 'approved',
                clearanceRequirementId: { $in: allMandatoryRequirements.map(r => r._id) }
            }).session(session);

            if (approvedSubmissionsCount === allMandatoryRequirements.length) {
                await ClearanceRequest.findByIdAndUpdate(submission.clearanceRequestId, {
                    status: 'completed',
                    finalApprovalDate: new Date()
                }).session(session);

                await logAudit({
                    userId: reviewerId,
                    institutionId,
                    action: 'CLEARANCE_REQUEST_FINALIZED',
                    category: 'clearance_workflow',
                    resource: 'ClearanceRequest',
                    resourceId: submission.clearanceRequestId as any,
                    severity: 'high',
                    req,
                    session
                });
            }

            await session.commitTransaction();
            return res.json({ message: "Submission approved successfully.", submission });
        }

    } catch (error: any) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw error;
    } finally {
        session.endSession();
    }
});

/**
 * Get submissions for review (for Officers/Admins)
 */
export const getSubmissionsForReview = catchAsync(async (req: Request, res: Response) => {
    const { organizationId, status } = req.query;
    const institutionId = (req as any).user?.institutionId;

    if (!institutionId) {
        throw new AppError("Institution context is required.", 401);
    }

    const query: any = { institutionId };
    if (organizationId) query.organizationId = organizationId;
    if (status) query.status = status;

    const submissions = await ClearanceSubmission.find(query)
        .populate('userId', 'fullName firstName lastName email studentId avatarUrl profilePicture')
        .populate('clearanceRequirementId', 'title officeId')
        .sort({ submittedAt: 1 });

    res.json({ submissions });
});
