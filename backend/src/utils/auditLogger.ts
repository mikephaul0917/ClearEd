import { Request } from 'express';
import AuditLog from '../models/AuditLog';
import mongoose from 'mongoose';

interface AuditParams {
    userId?: mongoose.Types.ObjectId | string;
    institutionId?: mongoose.Types.ObjectId | string;
    action: string;
    category: 'auth' | 'user_management' | 'organization_management' | 'clearance_workflow' | 'institution_management' | 'system';
    resource: string;
    resourceId?: mongoose.Types.ObjectId | string;
    details?: any;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    req: Request;
    session?: mongoose.ClientSession;
}

/**
 * Log a sensitive system action to the AuditLog collection.
 * Standardizes metadata like IP address and User Agent.
 */
export const logAudit = async (params: AuditParams) => {
    try {
        const {
            userId,
            institutionId,
            action,
            category,
            resource,
            resourceId,
            details = {},
            severity = 'low',
            req,
            session
        } = params;

        // Auto-capture request metadata
        let ipAddress = 'unknown';
        if (req.headers['x-forwarded-for']) {
            // Handle possibility of multiple IPs in x-forwarded-for
            const forwarded = req.headers['x-forwarded-for'] as string;
            ipAddress = forwarded.split(',')[0].trim();
        } else {
            ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        }

        // Beautify localhost IPv6
        if (ipAddress === '::1') ipAddress = '127.0.0.1';

        const userAgent = req.headers['user-agent'];

        const logEntry = {
            userId: userId ? new mongoose.Types.ObjectId(userId as string) : undefined,
            institutionId: institutionId ? new mongoose.Types.ObjectId(institutionId as string) : undefined,
            action: action.toUpperCase(),
            category,
            resource,
            resourceId: resourceId ? new mongoose.Types.ObjectId(resourceId as string) : undefined,
            details,
            severity,
            ipAddress,
            userAgent,
            timestamp: new Date()
        };

        if (session) {
            await AuditLog.create([logEntry], { session });
        } else {
            await AuditLog.create(logEntry);
        }
    } catch (error) {
        // We log to console but don't throw to prevent audit logging failures from crashing the request
        console.error('Audit Logging Error:', error);
    }
};
