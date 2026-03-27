import { Request, Response } from "express";
import ClearanceRequirement from "../models/ClearanceRequirement";
import ClearanceSubmission from "../models/ClearanceSubmission";
import OrganizationMember from "../models/OrganizationMember";
import ClearanceOffice from "../models/ClearanceOffice";
import AuditLog from "../models/AuditLog";
import mongoose from "mongoose";
import { logAudit } from "../utils/auditLogger";
import { AppError, catchAsync } from "../utils/errors";

/**
 * Creates a new clearance requirement within an organization.
 * Role: Clearance Officer (of the organization), Institution Admin, Super Admin
 */
export const createRequirement = async (req: Request, res: Response) => {
    try {
        const { title, description, instructions, topic, officeId, organizationId, isMandatory, isAnnouncement, type, requiredFiles, assignedTo, order, options } = req.body;
        const creatorId = (req as any).user?.id;
        const institutionId = (req as any).user?.institutionId;
        const userRole = (req as any).user?.role;

        if (!title || !description || !organizationId) {
            return res.status(400).json({ message: "Title, description, and organization ID are required." });
        }

        // 1. Permission Check
        let isAuthorized = userRole === 'super_admin' || userRole === 'admin';

        if (!isAuthorized) {
            // Check if requester is an officer in this specific organization
            const membership = await OrganizationMember.findOne({
                organizationId,
                userId: creatorId,
                role: "officer",
                status: "active"
            });
            if (membership) isAuthorized = true;
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: "You don't have permission to create requirements for this organization." });
        }

        // 2. Validate Office (if provided)
        if (officeId) {
            const office = await ClearanceOffice.findOne({ _id: officeId, institutionId });
            if (!office) {
                return res.status(400).json({ message: "Invalid clearance office for this institution." });
            }
        }

        // Parse options if sent as stringified JSON
        let parsedOptions = options;
        if (typeof options === 'string') {
            try {
                parsedOptions = JSON.parse(options);
            } catch (e) {
                parsedOptions = [];
            }
        }

        // 3. Create Requirement
        const newRequirement = await ClearanceRequirement.create({
            title,
            description,
            instructions,
            topic,
            officeId,
            organizationId,
            institutionId,
            createdBy: creatorId,
            isMandatory: isMandatory !== undefined ? isMandatory : true,
            isAnnouncement: isAnnouncement !== undefined ? isAnnouncement : false,
            type: type || 'requirement',
            options: parsedOptions,
            requiredFiles: requiredFiles || [],
            assignedTo: assignedTo || [],
            order: order || 0,
            isActive: true
        });

        // 4. Log the action
        await logAudit({
            userId: creatorId,
            institutionId,
            action: 'CLEARANCE_REQUIREMENT_CREATED',
            category: 'clearance_workflow',
            resource: 'ClearanceRequirement',
            resourceId: newRequirement._id as any,
            details: {
                title: newRequirement.title,
                organizationId: newRequirement.organizationId,
                officeId: newRequirement.officeId
            },
            severity: 'medium',
            req
        });

        res.status(201).json({
            message: "Clearance requirement created successfully.",
            requirement: newRequirement
        });

    } catch (error: any) {
        console.error('Create requirement error:', error);
        res.status(500).json({
            message: "Failed to create clearance requirement.",
            error: error.message
        });
    }
};

/**
 * Get all requirements for an organization
 */
export const getOrganizationRequirements = async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.params;
        const institutionId = (req as any).user?.institutionId;

        const requirements = await ClearanceRequirement.find({
            organizationId,
            institutionId,
            isActive: true
        })
            .populate('officeId', 'name sequence')
            .populate('createdBy', 'fullName avatarUrl')
            .sort({ order: 1, createdAt: 1 });

        // 2. If requester is an officer, fetch submission counts
        const userId = (req as any).user?.id;
        const membership = await OrganizationMember.findOne({
            organizationId,
            userId,
            role: "officer",
            status: "active"
        });

        if (membership || (req as any).user?.role === 'admin' || (req as any).user?.role === 'super_admin') {
            const stats = await ClearanceSubmission.aggregate([
                { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
                { $group: { _id: { requirementId: "$clearanceRequirementId", status: "$status" }, count: { $sum: 1 } } }
            ]);

            const totalMembers = await OrganizationMember.countDocuments({
                organizationId,
                role: "member",
                status: "active"
            });

            const requirementsWithStats = requirements.map(reqObj => {
                const reqIdStr = (reqObj._id as any).toString();
                const reqStats = stats.filter(s => s._id.requirementId && s._id.requirementId.toString() === reqIdStr);
                return {
                    ...reqObj.toObject(),
                    stats: {
                        pending: reqStats.find(s => s._id.status === 'pending')?.count || 0,
                        approved: reqStats.find(s => s._id.status === 'approved')?.count || 0,
                        rejected: reqStats.find(s => s._id.status === 'rejected')?.count || 0,
                        totalMembers
                    }
                };
            });

            return res.json({ requirements: requirementsWithStats });
        }

        res.json({ requirements });
    } catch (error: any) {
        console.error('Get requirements error:', error);
        res.status(500).json({ message: "Failed to fetch requirements." });
    }
};
