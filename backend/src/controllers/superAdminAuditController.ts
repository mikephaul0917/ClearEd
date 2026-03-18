import { Request, Response } from 'express';
import User from '../models/User';
import Institution from '../models/Institution';
import AuditLog from '../models/AuditLog';

// Get audit logs with filtering and pagination
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 50,
      institutionId,
      action,
      severity,
      category,
      dateRange = '7d',
      search
    } = req.query;

    // Calculate date range based on dateRange
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

    // Build filter object
    const filter: any = { createdAt: { $gte: startDate } };
    
    if (institutionId) {
      filter.institutionId = institutionId;
    }
    
    if (action) {
      filter.action = action;
    }
    
    if (severity) {
      filter.severity = severity;
    }
    
    if (category) {
      filter.category = category;
    }

    // Add search functionality
    if (search) {
      filter.$or = [
        { 'details': { $regex: search, $options: 'i' } },
        { 'action': { $regex: search, $options: 'i' } },
        { 'resource': { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const total = await AuditLog.countDocuments(filter);
    const totalPages = Math.ceil(total / Number(limit));

    // Get audit logs with user and institution details
    const logs = await AuditLog.find(filter)
      .populate('userId', 'fullName email')
      .populate('institutionId', 'name')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    // Format logs for frontend
    const formattedLogs = logs.map((log: any) => ({
      _id: log._id,
      userId: log.userId?._id || log.userId,
      userName: log.userId?.fullName || 'Unknown User',
      userEmail: log.userId?.email || '',
      institutionId: log.institutionId?._id || log.institutionId,
      institutionName: log.institutionId?.name || 'System Level',
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
        pagination: {
          current: Number(page),
          totalPages,
          total,
          limit: Number(limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
};

// Export audit logs
export const exportAuditLogs = async (req: Request, res: Response) => {
  try {
    const {
      institutionId,
      action,
      severity,
      category,
      dateRange = '30d',
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
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build filter object
    const filter: any = { createdAt: { $gte: startDate } };
    
    if (institutionId) {
      filter.institutionId = institutionId;
    }
    
    if (action) {
      filter.action = action;
    }
    
    if (severity) {
      filter.severity = severity;
    }
    
    if (category) {
      filter.category = category;
    }

    // Add search functionality
    if (search) {
      filter.$or = [
        { 'details': { $regex: search, $options: 'i' } },
        { 'action': { $regex: search, $options: 'i' } },
        { 'resource': { $regex: search, $options: 'i' } }
      ];
    }

    // Get all matching logs (no pagination for export)
    const logs = await AuditLog.find(filter)
      .populate('userId', 'fullName email')
      .populate('institutionId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Format logs for export
    const formattedLogs = logs.map((log: any) => ({
      _id: log._id,
      userId: log.userId?._id || log.userId,
      userName: log.userId?.fullName || 'Unknown User',
      userEmail: log.userId?.email || '',
      institutionId: log.institutionId?._id || log.institutionId,
      institutionName: log.institutionId?.name || 'System Level',
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
        filters: {
          institutionId,
          action,
          severity,
          category,
          dateRange,
          search
        }
      }
    });
  } catch (error: any) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export audit logs',
      error: error.message
    });
  }
};

// Get security events (failed logins, suspicious activities)
export const getSecurityEvents = async (req: Request, res: Response) => {
  try {
    const { dateRange = '7d' } = req.query;

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

    // Get security-related events
    const securityEvents = await AuditLog.find({
      createdAt: { $gte: startDate },
      $or: [
        { action: 'LOGIN_FAILED' },
        { action: 'SECURITY_ALERT' },
        { severity: 'critical' },
        { category: 'security' },
        { 
          action: 'LOGIN_FAILED',
          'details': { $regex: /suspicious|multiple|brute|attack/i }
        }
      ]
    })
    .populate('userId', 'fullName email')
    .populate('institutionId', 'name')
    .sort({ createdAt: -1 })
    .lean();

    // Get failed login statistics
    const failedLoginStats = await AuditLog.aggregate([
      {
        $match: {
          action: 'LOGIN_FAILED',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          uniqueIPs: { $addToSet: '$ipAddress' },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      { $sort: { '_id': -1 } }
    ]);

    res.json({
      success: true,
      data: {
        securityEvents,
        failedLoginStats,
        timeRange: dateRange
      }
    });
  } catch (error: any) {
    console.error('Error fetching security events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch security events',
      error: error.message
    });
  }
};

// Get admin actions
export const getAdminActions = async (req: Request, res: Response) => {
  try {
    const { dateRange = '30d' } = req.query;

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
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get admin-related actions
    const adminActions = await AuditLog.find({
      createdAt: { $gte: startDate },
      $or: [
        { category: 'admin' },
        { category: 'user_management' },
        { action: { $regex: /USER_|ADMIN_|INSTITUTION_/ } }
      ]
    })
    .populate('userId', 'fullName email')
    .populate('institutionId', 'name')
    .sort({ createdAt: -1 })
    .lean();

    // Get admin action statistics
    const adminActionStats = await AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          $or: [
            { category: 'admin' },
            { category: 'user_management' },
            { action: { $regex: /USER_|ADMIN_|INSTITUTION_/ } }
          ]
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          latest: { $max: '$createdAt' }
        }
      },
      { $sort: { 'latest': -1 } }
    ]);

    res.json({
      success: true,
      data: {
        adminActions,
        adminActionStats,
        timeRange: dateRange
      }
    });
  } catch (error: any) {
    console.error('Error fetching admin actions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin actions',
      error: error.message
    });
  }
};

// Get audit statistics
export const getAuditStats = async (req: Request, res: Response) => {
  try {
    const { dateRange = '30d' } = req.query;

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
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get comprehensive audit statistics
    const [
      totalLogs,
      criticalEvents,
      securityEvents,
      failedLogins,
      adminActions,
      uniqueUsers,
      uniqueIPs
    ] = await Promise.all([
      AuditLog.countDocuments({ createdAt: { $gte: startDate } }),
      AuditLog.countDocuments({ createdAt: { $gte: startDate }, severity: 'critical' }),
      AuditLog.countDocuments({ createdAt: { $gte: startDate }, category: 'security' }),
      AuditLog.countDocuments({ createdAt: { $gte: startDate }, action: 'LOGIN_FAILED' }),
      AuditLog.countDocuments({ createdAt: { $gte: startDate }, category: 'admin' }),
      AuditLog.distinct('userId', { createdAt: { $gte: startDate } }),
      AuditLog.distinct('ipAddress', { createdAt: { $gte: startDate } })
    ]);

    // Get action breakdown
    const actionBreakdown = await AuditLog.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get severity breakdown
    const severityBreakdown = await AuditLog.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalLogs,
        criticalEvents,
        securityEvents,
        failedLogins,
        adminActions,
        uniqueUsers,
        uniqueIPs,
        actionBreakdown,
        severityBreakdown,
        timeRange: dateRange
      }
    });
  } catch (error: any) {
    console.error('Error fetching audit statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit statistics',
      error: error.message
    });
  }
};
