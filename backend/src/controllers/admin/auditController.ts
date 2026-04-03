import { Request, Response } from 'express';
import AuditLog from '../../models/AuditLog';

// Get audit logs for the admin's institution with filtering and pagination
export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const institutionId = (req as any).user?.institutionId;
        if (!institutionId) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Institution not found in session' });
        }

        const {
            page = 1,
            limit = 50,
            action,
            severity,
            category,
            dateRange = '7d',
            search
        } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (dateRange) {
            case '1d':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        // Build filter object - Always filter by institutionId!
        const filter: any = {
            institutionId,
            createdAt: { $gte: startDate }
        };

        if (action) {
            filter.action = action;
        }

        if (severity) {
            if (typeof severity === 'string' && severity.includes(',')) {
                filter.severity = { $in: severity.split(',') };
            } else {
                filter.severity = severity;
            }
        }

        if (category) {
            if (typeof category === 'string' && category.includes(',')) {
                filter.category = { $in: category.split(',') };
            } else {
                filter.category = category;
            }
        }

        // Search functionality
        if (search) {
            filter.$or = [
                { 'details': { $regex: search, $options: 'i' } },
                { 'action': { $regex: search, $options: 'i' } },
                { 'resource': { $regex: search, $options: 'i' } }
            ];
        }

        const total = await AuditLog.countDocuments(filter);
        const totalPages = Math.ceil(total / Number(limit));

        const logs = await AuditLog.find(filter)
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .lean();

        const formattedLogs = logs.map((log: any) => ({
            _id: log._id,
            userId: log.userId?._id || log.userId,
            userName: log.userId?.fullName || 'Unknown User',
            userEmail: log.userId?.email || '',
            action: log.action,
            resource: log.resource,
            details: typeof log.details === 'object' ? JSON.stringify(log.details) : log.details,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            severity: log.severity,
            category: log.category,
            createdAt: log.createdAt
        }));

        res.json({
            success: true,
            data: {
                logs: formattedLogs,
                pagination: {
                    current: Number(page),
                    totalPages,
                    total,
                    limit: Number(limit)
                }
            }
        });
    } catch (error: any) {
        console.error('Error fetching admin audit logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs',
            error: error.message
        });
    }
};

// Export audit logs for the admin's institution
export const exportAuditLogs = async (req: Request, res: Response) => {
    try {
        const institutionId = (req as any).user?.institutionId;
        if (!institutionId) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Institution not found in session' });
        }

        const {
            action,
            severity,
            category,
            dateRange = '30d',
            search
        } = req.query;

        const now = new Date();
        let startDate: Date;

        switch (dateRange) {
            case '1d': startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
            case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
            case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
            case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
            case '1y': startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
            default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const filter: any = {
            institutionId,
            createdAt: { $gte: startDate }
        };

        if (action) filter.action = action;
        if (severity) filter.severity = severity;
        if (category) filter.category = category;
        if (search) {
            filter.$or = [
                { 'details': { $regex: search, $options: 'i' } },
                { 'action': { $regex: search, $options: 'i' } },
                { 'resource': { $regex: search, $options: 'i' } }
            ];
        }

        const logs = await AuditLog.find(filter)
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 })
            .lean();

        const formattedLogs = logs.map((log: any) => ({
            _id: log._id,
            userId: log.userId?._id || log.userId,
            userName: log.userId?.fullName || 'Unknown User',
            userEmail: log.userId?.email || '',
            action: log.action,
            resource: log.resource,
            details: log.details,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            severity: log.severity,
            category: log.category,
            createdAt: log.createdAt
        }));

        res.json({
            success: true,
            data: {
                logs: formattedLogs,
                exportedAt: new Date(),
                filters: { action, severity, category, dateRange, search }
            }
        });
    } catch (error: any) {
        console.error('Error exporting admin audit logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export audit logs',
            error: error.message
        });
    }
};
