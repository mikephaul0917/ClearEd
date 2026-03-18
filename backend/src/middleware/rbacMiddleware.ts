import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import AuditLog from "../models/AuditLog";
import mongoose from "mongoose";
import { AppError } from "../utils/errors";

// Extend Express Request interface locally to avoid namespace clashes if needed, 
// though enhancedAuthMiddleware.ts already did it globally.
// We'll use a local interface for type safety within this file.
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: "student" | "officer" | "dean" | "admin" | "super_admin";
        institutionId?: string | null;
        email: string;
    };
}

/**
 * Protect Middleware
 * Verifies the JWT and attaches the user document to the request object.
 */
export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return next(new AppError("You are not logged in. Please log in to get access.", 401));
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

        // Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return next(new AppError("The user belonging to this token no longer exists.", 401));
        }

        // Check if user is enabled
        if (!currentUser.enabled) {
            return next(new AppError("Your account has been disabled. Please contact your administrator.", 401));
        }

        // GRANT ACCESS TO PROTECTED ROUTE
        req.user = {
            id: currentUser._id.toString(),
            role: currentUser.role,
            institutionId: currentUser.institutionId?.toString() || null,
            email: currentUser.email
        };

        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return next(new AppError("Your token has expired. Please log in again.", 401));
        }
        return next(new AppError("Invalid token. Please log in again.", 401));
    }
};

/**
 * RestrictTo Middleware Factory
 * Restricts access based on user roles.
 */
export const restrictTo = (...roles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError("Authentication required", 401));
        }

        if (!roles.includes(req.user.role)) {
            // Log unauthorized attempt
            AuditLog.create({
                userId: new mongoose.Types.ObjectId(req.user.id),
                institutionId: req.user.institutionId ? new mongoose.Types.ObjectId(req.user.institutionId) : undefined,
                action: 'UNAUTHORIZED_ROLE_ACCESS',
                category: 'auth',
                resource: 'API_ROUTE',
                details: {
                    requiredRoles: roles,
                    userRole: req.user.role,
                    path: req.originalUrl
                },
                severity: 'medium',
                ipAddress: req.ip || 'unknown'
            }).catch(err => console.error('Failed to create audit log:', err));

            return next(new AppError("You do not have permission to perform this action", 403));
        }

        next();
    };
};

/**
 * ScopeToInstitution Middleware
 * Enforces institution isolation.
 * Prevents users from accessing resources belonging to other institutions.
 * Super Admins bypass this check.
 */
export const scopeToInstitution = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError("Authentication required", 401));
    }

    // Super Admin bypasses institution scoping
    if (req.user.role === 'super_admin') {
        return next();
    }

    const requestedInstitutionId = req.params.institutionId || req.body.institutionId || req.query.institutionId;

    if (requestedInstitutionId && requestedInstitutionId !== req.user.institutionId) {
        // Log potential cross-tenant attack
        AuditLog.create({
            userId: new mongoose.Types.ObjectId(req.user.id),
            institutionId: req.user.institutionId ? new mongoose.Types.ObjectId(req.user.institutionId) : undefined,
            action: 'CROSS_INSTITUTION_ACCESS_VIOLATION',
            category: 'security',
            resource: 'DATA_ISOLATION',
            details: {
                userInstitution: req.user.institutionId,
                requestedInstitution: requestedInstitutionId,
                path: req.originalUrl
            },
            severity: 'high',
            ipAddress: req.ip || 'unknown'
        }).catch(err => console.error('Failed to create audit log:', err));

        return next(new AppError("Access denied. You cannot access resources outside your institution.", 403));
    }

    next();
};

/**
 * SuperAdminOnly Shorthand
 */
export const superAdminOnly = [protect, restrictTo('super_admin')];

/**
 * InstitutionAdminOnly Shorthand (includes Super Admin)
 */
export const institutionAdminOnly = [protect, restrictTo('admin', 'super_admin'), scopeToInstitution];
