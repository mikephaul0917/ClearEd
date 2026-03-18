import AuditLog from '../models/AuditLog';

export interface AuditData {
  userId: string;
  institutionId?: string;
  action: string;
  resource: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'clearance_workflow' | 'authentication' | 'user_management' | 'institution_management' | 'system';
}

export class AuditService {
  /**
   * Create an audit log entry
   */
  static async createAuditLog(data: AuditData): Promise<void> {
    try {
      await AuditLog.create({
        userId: data.userId,
        institutionId: data.institutionId,
        action: data.action,
        resource: data.resource,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        severity: data.severity,
        category: data.category,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      throw error;
    }
  }

  /**
   * Create bulk audit logs
   */
  static async createBulkAuditLogs(auditData: AuditData[]): Promise<void> {
    try {
      const auditDocs = auditData.map(data => ({
        userId: data.userId,
        institutionId: data.institutionId,
        action: data.action,
        resource: data.resource,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        severity: data.severity,
        category: data.category,
        timestamp: new Date()
      }));

      await AuditLog.insertMany(auditDocs);
    } catch (error) {
      console.error('Failed to create bulk audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs with pagination
   */
  static async getAuditLogs(
    institutionId: string,
    filters: {
      userId?: string;
      action?: string;
      category?: string;
      severity?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{ logs: any[], total: number }> {
    try {
      const query: any = { institutionId };

      // Add filters to query
      if (filters.userId) query.userId = filters.userId;
      if (filters.action) query.action = filters.action;
      if (filters.category) query.category = filters.category;
      if (filters.severity) query.severity = filters.severity;

      // Add date range filter
      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = filters.startDate;
        if (filters.endDate) query.timestamp.$lte = filters.endDate;
      }

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'fullName email')
          .lean(),
        AuditLog.countDocuments(query)
      ]);

      return { logs, total };
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  static async getAuditStatistics(institutionId: string, days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [actionStats, severityStats, categoryStats] = await Promise.all([
        // Action statistics
        AuditLog.aggregate([
          { $match: { institutionId, timestamp: { $gte: startDate } } },
          {
            $group: {
              _id: '$action',
              count: { $sum: 1 }
            }
          }
        ]),

        // Severity statistics
        AuditLog.aggregate([
          { $match: { institutionId, timestamp: { $gte: startDate } } },
          {
            $group: {
              _id: '$severity',
              count: { $sum: 1 }
            }
          }
        ]),

        // Category statistics
        AuditLog.aggregate([
          { $match: { institutionId, timestamp: { $gte: startDate } } },
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      return {
        actionStats: actionStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        severityStats: severityStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        categoryStats: categoryStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        totalLogs: Object.values(actionStats).reduce((sum, count) => sum + count, 0)
      };
    } catch (error) {
      console.error('Failed to get audit statistics:', error);
      throw error;
    }
  }

  /**
   * Log clearance submission action
   */
  static async logClearanceSubmission(
    userId: string,
    institutionId: string,
    action: 'SUBMIT' | 'REVIEW' | 'APPROVE' | 'REJECT' | 'FINAL_APPROVE' | 'DOWNLOAD_FILE',
    details: {
      submissionId?: string;
      clearanceItemId?: string;
      studentName?: string;
      officerName?: string;
      notes?: string;
      rejectionReason?: string;
      fileName?: string;
    }
  ): Promise<void> {
    const actionDetails = {
      SUBMIT: {
        action: 'CLEARANCE_SUBMIT',
        details: `Student submitted clearance item: ${details.clearanceItemId}`
      },
      REVIEW: {
        action: 'CLEARANCE_REVIEW',
        details: `Officer reviewed submission for: ${details.studentName}`
      },
      APPROVE: {
        action: 'CLEARANCE_APPROVE',
        details: `Officer approved submission for: ${details.studentName}`
      },
      REJECT: {
        action: 'CLEARANCE_REJECT',
        details: `Officer rejected submission for: ${details.studentName}. Reason: ${details.rejectionReason}`
      },
      FINAL_APPROVE: {
        action: 'CLEARANCE_FINAL_APPROVE',
        details: `Dean granted final approval for: ${details.studentName}`
      },
      DOWNLOAD_FILE: {
        action: 'CLEARANCE_DOWNLOAD_FILE',
        details: `User downloaded file: ${details.fileName}`
      }
    };

    const auditData = actionDetails[action];
    await this.createAuditLog({
      userId,
      institutionId,
      action: auditData.action,
      resource: 'ClearanceSubmission',
      details: auditData.details,
      severity: this.getSeverityForAction(action),
      category: 'clearance_workflow'
    });
  }

  /**
   * Log clearance item management action
   */
  static async logClearanceItemManagement(
    userId: string,
    institutionId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN_OFFICER',
    details: {
      clearanceItemId?: string;
      clearanceTitle?: string;
      officerName?: string;
      oldValues?: any;
      newValues?: any;
    }
  ): Promise<void> {
    const actionDetails = {
      CREATE: {
        action: 'CLEARANCE_ITEM_CREATE',
        details: `Created clearance item: ${details.clearanceTitle}`
      },
      UPDATE: {
        action: 'CLEARANCE_ITEM_UPDATE',
        details: `Updated clearance item: ${details.clearanceTitle}`
      },
      DELETE: {
        action: 'CLEARANCE_ITEM_DELETE',
        details: `Deleted clearance item: ${details.clearanceTitle}`
      },
      ASSIGN_OFFICER: {
        action: 'CLEARANCE_ASSIGN_OFFICER',
        details: `Assigned officer ${details.officerName} to clearance item: ${details.clearanceTitle}`
      }
    };

    const auditData = actionDetails[action];
    await this.createAuditLog({
      userId,
      institutionId,
      action: auditData.action,
      resource: 'ClearanceItem',
      details: auditData.details,
      severity: this.getSeverityForAction(action),
      category: 'clearance_workflow'
    });
  }

  /**
   * Log user management action
   */
  static async logUserManagement(
    userId: string,
    institutionId: string,
    action: 'LOGIN' | 'LOGOUT' | 'PROFILE_UPDATE' | 'PASSWORD_CHANGE' | 'ACCOUNT_CREATE' | 'ACCOUNT_UPDATE' | 'ACCOUNT_DELETE' | 'ROLE_CHANGE',
    details: {
      targetUserId?: string;
      oldRole?: string;
      newRole?: string;
      email?: string;
      reason?: string;
    }
  ): Promise<void> {
    const actionDetails = {
      LOGIN: {
        action: 'USER_LOGIN',
        details: `User logged in: ${details.email}`
      },
      LOGOUT: {
        action: 'USER_LOGOUT',
        details: 'User logged out'
      },
      PROFILE_UPDATE: {
        action: 'USER_PROFILE_UPDATE',
        details: 'User updated profile'
      },
      PASSWORD_CHANGE: {
        action: 'USER_PASSWORD_CHANGE',
        details: 'User changed password'
      },
      ACCOUNT_CREATE: {
        action: 'USER_ACCOUNT_CREATE',
        details: `Created account for: ${details.email}`
      },
      ACCOUNT_UPDATE: {
        action: 'USER_ACCOUNT_UPDATE',
        details: `Updated account for: ${details.email}`
      },
      ACCOUNT_DELETE: {
        action: 'USER_ACCOUNT_DELETE',
        details: `Deleted account for: ${details.email}. Reason: ${details.reason}`
      },
      ROLE_CHANGE: {
        action: 'USER_ROLE_CHANGE',
        details: `Changed role for user: ${details.targetUserId} from ${details.oldRole} to ${details.newRole}`
      }
    };

    const auditData = actionDetails[action];
    await this.createAuditLog({
      userId,
      institutionId,
      action: auditData.action,
      resource: 'User',
      details: auditData.details,
      severity: this.getSeverityForAction(action),
      category: 'user_management'
    });
  }

  /**
   * Log institution management action
   */
  static async logInstitutionManagement(
    userId: string,
    institutionId: string,
    action: 'APPROVE_REQUEST' | 'REJECT_REQUEST' | 'UPDATE_INSTITUTION' | 'CREATE_INSTITUTION',
    details: {
      institutionName?: string;
      requestType?: string;
      reason?: string;
    }
  ): Promise<void> {
    const actionDetails = {
      APPROVE_REQUEST: {
        action: 'INSTITUTION_APPROVE_REQUEST',
        details: `Approved institution request for: ${details.institutionName}`
      },
      REJECT_REQUEST: {
        action: 'INSTITUTION_REJECT_REQUEST',
        details: `Rejected institution request for: ${details.institutionName}. Reason: ${details.reason}`
      },
      UPDATE_INSTITUTION: {
        action: 'INSTITUTION_UPDATE',
        details: `Updated institution: ${details.institutionName}`
      },
      CREATE_INSTITUTION: {
        action: 'INSTITUTION_CREATE',
        details: `Created institution: ${details.institutionName}`
      }
    };

    const auditData = actionDetails[action];
    await this.createAuditLog({
      userId,
      institutionId,
      action: auditData.action,
      resource: 'Institution',
      details: auditData.details,
      severity: this.getSeverityForAction(action),
      category: 'institution_management'
    });
  }

  /**
   * Get severity level for action
   */
  private static getSeverityForAction(action: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalActions = [
      'USER_DELETE',
      'CLEARANCE_ITEM_DELETE',
      'INSTITUTION_REJECT_REQUEST'
    ];

    const highActions = [
      'CLEARANCE_REJECT',
      'CLEARANCE_FINAL_REJECT',
      'USER_ROLE_CHANGE'
    ];

    const mediumActions = [
      'CLEARANCE_SUBMIT',
      'CLEARANCE_REVIEW',
      'CLEARANCE_APPROVE',
      'CLEARANCE_FINAL_APPROVE',
      'CLEARANCE_DOWNLOAD_FILE',
      'CLEARANCE_ITEM_UPDATE',
      'CLEARANCE_ASSIGN_OFFICER',
      'USER_LOGIN',
      'USER_PASSWORD_CHANGE',
      'INSTITUTION_APPROVE_REQUEST',
      'INSTITUTION_UPDATE'
    ];

    if (criticalActions.includes(action)) {
      return 'critical';
    } else if (highActions.includes(action)) {
      return 'high';
    } else if (mediumActions.includes(action)) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}
