import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import DeanAssignment from "../models/DeanAssignment";
import StudentProfile from "../models/StudentProfile";
import ClearanceSubmission from "../models/ClearanceSubmission";
import AuditLog from "../models/AuditLog";

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
        institutionId?: string | null;
        email: string;
    };
}

/**
 * ValidateDeanAssignment Middleware
 * Ensures that a Dean can only approve/review students within their assigned courses and year levels.
 * This middleware should be placed AFTER 'protect' and 'restrictTo("dean")'.
 */
export const validateDeanAssignment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || req.user.role !== 'dean') {
            return next(); // If not a dean, skip this check (handled by other middlewares)
        }

        const deanId = new mongoose.Types.ObjectId(req.user.id);
        const institutionId = new mongoose.Types.ObjectId(req.user.institutionId!);

        // 1. Identify the student context
        // Try to get student ID from body, query, or by looking up a submission
        let studentUserId = req.body.studentId || req.query.studentId;
        const submissionId = req.params.submissionId || req.body.submissionId;

        if (!studentUserId && submissionId) {
            const submission = await ClearanceSubmission.findById(submissionId);
            if (submission) {
                studentUserId = submission.userId;
            }
        }

        if (!studentUserId) {
            return res.status(400).json({ message: "Student context is required for Dean approval verification." });
        }

        // 2. Fetch Student Profile to get course and year
        const studentProfile = await StudentProfile.findOne({
            userId: studentUserId,
            institutionId
        });

        if (!studentProfile) {
            return res.status(404).json({ message: "Student profile not found." });
        }

        // 3. Fetch Dean's Assignments
        const assignments = await DeanAssignment.find({
            deanId,
            institutionId
        });

        if (!assignments || assignments.length === 0) {
            return res.status(403).json({
                message: "You have no assigned courses or year levels. Please contact your administrator."
            });
        }

        // 4. Validate Match
        const isAuthorized = assignments.some(assignment => {
            const courseMatch = assignment.course.toLowerCase() === studentProfile.course.toLowerCase();
            const yearMatch = assignment.yearLevel === "All" || assignment.yearLevel === studentProfile.year;
            return courseMatch && yearMatch;
        });

        if (!isAuthorized) {
            // Log unauthorized attempt
            await AuditLog.create({
                userId: deanId,
                institutionId,
                action: 'UNAUTHORIZED_DEAN_APPROVAL_ATTEMPT',
                category: 'auth',
                resource: 'ClearanceSubmission',
                resourceId: submissionId ? new mongoose.Types.ObjectId(submissionId) : undefined,
                details: {
                    attemptedStudentId: studentUserId,
                    studentCourse: studentProfile.course,
                    studentYear: studentProfile.year,
                    deanAssignments: assignments.map(a => ({ course: a.course, yearLevel: a.yearLevel }))
                },
                severity: 'high',
                ipAddress: req.ip || 'unknown'
            });

            return res.status(403).json({
                message: "Access Denied. You are not authorized to approve students in this course or year level."
            });
        }

        next();
    } catch (error: any) {
        console.error('Dean assignment validation error:', error);
        res.status(500).json({ message: "Internal server error during Dean validation." });
    }
};
