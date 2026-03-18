import { Request, Response } from 'express';
import User from '../models/User';
import Institution from '../models/Institution';
import ClearanceRequest from '../models/ClearanceRequest';
import AuditLog from '../models/AuditLog';

// Get comprehensive system analytics
export const getSystemAnalytics = async (req: Request, res: Response) => {
  try {
    const { timeRange = '30d' } = req.query;

    // Calculate date range based on timeRange
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
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

    // Get institution metrics
    const [
      totalInstitutions,
      activeInstitutions,
      suspendedInstitutions
    ] = await Promise.all([
      Institution.countDocuments(),
      Institution.countDocuments({ status: 'approved' }),
      Institution.countDocuments({ status: 'suspended' })
    ]);

    // Get user metrics
    const [
      totalUsers,
      studentCount,
      officerCount,
      adminCount,
      deanCount,
      superAdminCount
    ] = await Promise.all([
      User.countDocuments({ status: { $ne: 'deleted' } }),
      User.countDocuments({ role: 'student', status: { $ne: 'deleted' } }),
      User.countDocuments({ role: 'officer', status: { $ne: 'deleted' } }),
      User.countDocuments({ role: 'admin', status: { $ne: 'deleted' } }),
      User.countDocuments({ role: 'dean', status: { $ne: 'deleted' } }),
      User.countDocuments({ role: 'super_admin', status: { $ne: 'deleted' } })
    ]);

    // Get clearance request metrics
    const [
      totalClearanceRequests,
      processedClearanceRequests,
      pendingClearanceRequests
    ] = await Promise.all([
      ClearanceRequest.countDocuments(),
      ClearanceRequest.countDocuments({
        status: { $in: ['completed', 'approved', 'rejected'] }
      }),
      ClearanceRequest.countDocuments({
        status: { $in: ['pending', 'in_progress', 'submitted'] }
      })
    ]);

    // Get login activity metrics
    const [
      dailyLogins,
      weeklyLogins,
      monthlyLogins
    ] = await Promise.all([
      // Daily logins (last 24 hours)
      AuditLog.countDocuments({
        action: { $regex: /LOGIN/i },
        timestamp: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      }),
      // Weekly logins (last 7 days)
      AuditLog.countDocuments({
        action: { $regex: /LOGIN/i },
        timestamp: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
      }),
      // Monthly logins (last 30 days)
      AuditLog.countDocuments({
        action: { $regex: /LOGIN/i },
        timestamp: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);

    // Get institution completion rates
    const institutions = await Institution.find({ status: 'approved' })
      .select('_id name')
      .lean();

    const clearanceCompletionRates = await Promise.all(
      institutions.map(async (institution) => {
        const [totalRequests, completedRequests] = await Promise.all([
          ClearanceRequest.countDocuments({
            institutionId: institution._id,
            createdAt: { $gte: startDate }
          }),
          ClearanceRequest.countDocuments({
            institutionId: institution._id,
            status: { $in: ['completed', 'approved'] },
            createdAt: { $gte: startDate }
          })
        ]);

        const completionRate = totalRequests > 0
          ? (completedRequests / totalRequests) * 100
          : 0;

        return {
          institutionId: institution._id.toString(),
          institutionName: institution.name,
          totalRequests,
          completedRequests,
          completionRate,
          status: 'active'
        };
      })
    );

    // Sort by completion rate (highest first)
    clearanceCompletionRates.sort((a, b) => b.completionRate - a.completionRate);

    const analytics = {
      totalInstitutions,
      activeInstitutions,
      suspendedInstitutions,
      totalUsers,
      userBreakdown: {
        students: studentCount,
        officers: officerCount,
        admins: adminCount,
        deans: deanCount,
        super_admins: superAdminCount
      },
      totalClearanceRequests,
      processedClearanceRequests,
      pendingClearanceRequests,
      loginActivity: {
        daily: dailyLogins,
        weekly: weeklyLogins,
        monthly: monthlyLogins
      },
      clearanceCompletionRates
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    console.error('Error fetching system analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system analytics',
      error: error.message
    });
  }
};

// Get detailed institution analytics
export const getInstitutionAnalytics = async (req: Request, res: Response) => {
  try {
    const { institutionId } = req.params;
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
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

    // Get institution details
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    // Get user counts by role
    const userCounts = await User.aggregate([
      { $match: { institutionId: institution._id, status: { $ne: 'deleted' } } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Get clearance request statistics
    const [
      totalRequests,
      completedRequests,
      pendingRequests,
      rejectedRequests
    ] = await Promise.all([
      ClearanceRequest.countDocuments({
        institutionId: institution._id,
        createdAt: { $gte: startDate }
      }),
      ClearanceRequest.countDocuments({
        institutionId: institution._id,
        status: 'completed',
        createdAt: { $gte: startDate }
      }),
      ClearanceRequest.countDocuments({
        institutionId: institution._id,
        status: { $in: ['pending', 'in_progress'] },
        createdAt: { $gte: startDate }
      }),
      ClearanceRequest.countDocuments({
        institutionId: institution._id,
        status: 'rejected',
        createdAt: { $gte: startDate }
      })
    ]);

    // Get daily activity trends
    const dailyActivity = await AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
          $or: [
            { action: { $regex: /LOGIN/i } },
            { action: 'CLEARANCE_SUBMITTED' },
            { action: 'CLEARANCE_APPROVED' }
          ]
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          logins: {
            $sum: { $cond: [{ $regexMatch: { input: '$action', regex: /LOGIN/i } }, 1, 0] }
          },
          submissions: {
            $sum: { $cond: [{ $eq: ['$action', 'CLEARANCE_SUBMITTED'] }, 1, 0] }
          },
          approvals: {
            $sum: { $cond: [{ $eq: ['$action', 'CLEARANCE_APPROVED'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const analytics = {
      institution: {
        id: institution._id,
        name: institution.name,
        domain: institution.domain,
        status: institution.status
      },
      userCounts: userCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      clearanceStats: {
        total: totalRequests,
        completed: completedRequests,
        pending: pendingRequests,
        rejected: rejectedRequests,
        completionRate: totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0
      },
      dailyActivity
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    console.error('Error fetching institution analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch institution analytics',
      error: error.message
    });
  }
};

// Get system health metrics
export const getSystemHealth = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get error rates
    const [
      totalLogins,
      failedLogins,
      totalClearanceActions,
      failedClearanceActions
    ] = await Promise.all([
      AuditLog.countDocuments({
        action: { $regex: /LOGIN/i },
        timestamp: { $gte: last24Hours }
      }),
      AuditLog.countDocuments({
        action: { $regex: /LOGIN_FAILED|AUTH_FAILED/i },
        timestamp: { $gte: last24Hours }
      }),
      AuditLog.countDocuments({
        action: { $in: ['CLEARANCE_SUBMITTED', 'CLEARANCE_APPROVED', 'CLEARANCE_REJECTED'] },
        timestamp: { $gte: last24Hours }
      }),
      AuditLog.countDocuments({
        action: { $in: ['CLEARANCE_ERROR', 'CLEARANCE_FAILED'] },
        timestamp: { $gte: last24Hours }
      })
    ]);

    // Get system performance metrics
    const [
      activeUsers24h,
      newUsers7d,
      databaseSize
    ] = await Promise.all([
      AuditLog.distinct('userId', {
        action: { $regex: /LOGIN/i },
        timestamp: { $gte: last24Hours }
      }).then(users => users.length),
      User.countDocuments({
        createdAt: { $gte: last7Days }
      }),
      // This would require MongoDB stats collection in a real implementation
      Promise.resolve(0) // Placeholder for database size
    ]);

    const healthMetrics = {
      performance: {
        loginSuccessRate: totalLogins > 0 ? ((totalLogins - failedLogins) / totalLogins) * 100 : 100,
        clearanceSuccessRate: totalClearanceActions > 0 ? ((totalClearanceActions - failedClearanceActions) / totalClearanceActions) * 100 : 100,
        activeUsers24h,
        newUsers7d
      },
      system: {
        databaseSize,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      },
      errors: {
        failedLogins24h: failedLogins,
        failedClearanceActions24h: failedClearanceActions
      }
    };

    res.json({
      success: true,
      data: healthMetrics
    });
  } catch (error: any) {
    console.error('Error fetching system health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system health metrics',
      error: error.message
    });
  }
};
