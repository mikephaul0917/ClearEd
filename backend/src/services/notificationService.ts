import Notification from '../models/Notification';
import User from '../models/User';
import { sendEmail } from '../utils/emailService';

export interface NotificationData {
  userId: string;
  institutionId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'clearance_workflow' | 'system' | 'security';
  relatedEntityId?: string;
  relatedEntityType?: string;
  actionUrl?: string;
}

export class NotificationService {
  /**
   * Create a notification for a user
   */
  static async createNotification(data: NotificationData): Promise<void> {
    try {
      const notification = await Notification.create({
        userId: data.userId,
        institutionId: data.institutionId,
        title: data.title,
        message: data.message,
        type: data.type,
        category: data.category,
        relatedEntityId: data.relatedEntityId,
        relatedEntityType: data.relatedEntityType,
        actionUrl: data.actionUrl,
        isRead: false,
        createdAt: new Date(),
        createdBy: 'system'
      });

      // Send email notification if user has email
      await this.sendEmailNotification(notification);
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Create bulk notifications for multiple users
   */
  static async createBulkNotifications(notifications: NotificationData[]): Promise<void> {
    try {
      const notificationDocs = notifications.map(data => ({
        userId: data.userId,
        institutionId: data.institutionId,
        title: data.title,
        message: data.message,
        type: data.type,
        category: data.category,
        relatedEntityId: data.relatedEntityId,
        relatedEntityType: data.relatedEntityType,
        actionUrl: data.actionUrl,
        isRead: false,
        createdAt: new Date(),
        createdBy: 'system'
      }));

      await Notification.insertMany(notificationDocs);

      // Send email notifications in bulk
      await this.sendBulkEmailNotifications(notifications);
    } catch (error) {
      console.error('Failed to create bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true, readAt: new Date() },
        { new: true }
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications for a user
   */
  static async getUnreadNotifications(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const notifications = await Notification.find({
        userId,
        isRead: false
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('relatedEntityId', 'title')
        .lean();

      return notifications;
    } catch (error) {
      console.error('Failed to get unread notifications:', error);
      throw error;
    }
  }

  /**
   * Get all notifications for a user with pagination
   */
  static async getAllNotifications(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ notifications: any[], total: number }> {
    try {
      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        Notification.find({ userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('relatedEntityId', 'title')
          .lean(),
        Notification.countDocuments({ userId })
      ]);

      return { notifications, total };
    } catch (error) {
      console.error('Failed to get all notifications:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      await Notification.findOneAndDelete({
        _id: notificationId,
        userId
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Send email notification to user
   */
  private static async sendEmailNotification(notification: any): Promise<void> {
    try {
      const user = await User.findById(notification.userId);
      if (user && user.email) {
        const emailSubject = `E-Clearance: ${notification.title}`;
        const emailBody = `
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
          ${notification.actionUrl ? `<p><a href="${notification.actionUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a></p>` : ''}
          <br>
          <small>This is an automated message from the E-Clearance system.</small>
        `;

        await sendEmail({
          to: user.email,
          subject: emailSubject,
          html: emailBody
        });
      }
    } catch (error) {
      console.error('Failed to send email notification:', error);
      // Don't throw error here to avoid breaking the main flow
    }
  }

  /**
   * Send bulk email notifications
   */
  private static async sendBulkEmailNotifications(notifications: NotificationData[]): Promise<void> {
    try {
      const userIds = [...new Set(notifications.map(n => n.userId))];
      const users = await User.find({ _id: { $in: userIds } }).select('email fullName').lean();
      const typedUsers = users as Array<{ _id: any; email: string; fullName?: string }>;

      const emailPromises = notifications.map(async (notification) => {
        const user = typedUsers.find(u => u._id.toString() === notification.userId);
        if (user && user.email) {
          const emailSubject = `E-Clearance: ${notification.title}`;
          const emailBody = `
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            ${notification.actionUrl ? `<p><a href="${notification.actionUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a></p>` : ''}
            <br>
            <small>This is an automated message from the E-Clearance system.</small>
          `;

          return sendEmail({
            to: user.email,
            subject: emailSubject,
            html: emailBody
          });
        }
      });

      await Promise.all(emailPromises);
    } catch (error) {
      console.error('Failed to send bulk email notifications:', error);
      // Don't throw error here to avoid breaking the main flow
    }
  }

  /**
   * Create clearance submission notification
   */
  static async createClearanceSubmissionNotification(
    studentId: string,
    institutionId: string,
    clearanceTitle: string,
    status: 'submitted' | 'approved' | 'rejected' | 'resubmission_required'
  ): Promise<void> {
    const statusMessages = {
      submitted: {
        title: 'Clearance Item Submitted',
        message: `Your clearance item "${clearanceTitle}" has been submitted for review.`,
        type: 'info' as const,
        actionUrl: '/student/requirements'
      },
      approved: {
        title: 'Clearance Item Approved',
        message: `Your clearance item "${clearanceTitle}" has been approved!`,
        type: 'success' as const,
        actionUrl: '/student/requirements'
      },
      rejected: {
        title: 'Clearance Item Rejected',
        message: `Your clearance item "${clearanceTitle}" has been rejected. Please check the rejection reason and resubmit if necessary.`,
        type: 'error' as const,
        actionUrl: '/student/requirements'
      },
      resubmission_required: {
        title: 'Resubmission Required',
        message: `Your clearance item "${clearanceTitle}" requires resubmission. Please review the feedback and submit the required documents.`,
        type: 'warning' as const,
        actionUrl: '/student/requirements'
      }
    };

    const messageData = statusMessages[status];
    await this.createNotification({
      userId: studentId,
      institutionId,
      ...messageData,
      category: 'clearance_workflow',
      relatedEntityType: 'ClearanceItem',
      relatedEntityId: clearanceTitle
    });
  }

  /**
   * Create officer review notification
   */
  static async createOfficerReviewNotification(
    officerId: string,
    institutionId: string,
    studentName: string,
    clearanceTitle: string,
    action: 'assigned' | 'approved' | 'rejected'
  ): Promise<void> {
    const actionMessages = {
      assigned: {
        title: 'New Submission Assigned',
        message: `A new submission for "${clearanceTitle}" from ${studentName} has been assigned to you for review.`,
        type: 'info' as const,
        actionUrl: '/officer/review'
      },
      approved: {
        title: 'Submission Approved',
        message: `You have approved the submission for "${clearanceTitle}" from ${studentName}.`,
        type: 'success' as const,
        actionUrl: '/officer/review'
      },
      rejected: {
        title: 'Submission Rejected',
        message: `You have rejected the submission for "${clearanceTitle}" from ${studentName}.`,
        type: 'error' as const,
        actionUrl: '/officer/review'
      }
    };

    const messageData = actionMessages[action];
    await this.createNotification({
      userId: officerId,
      institutionId,
      ...messageData,
      category: 'clearance_workflow',
      relatedEntityType: 'ClearanceSubmission',
      relatedEntityId: studentName
    });
  }

  /**
   * Create dean approval notification
   */
  static async createDeanApprovalNotification(
    deanId: string,
    institutionId: string,
    studentName: string,
    clearanceTitle: string,
    action: 'approved' | 'rejected'
  ): Promise<void> {
    const actionMessages = {
      approved: {
        title: 'Final Approval Granted',
        message: `You have granted final approval for "${clearanceTitle}" submission from ${studentName}.`,
        type: 'success' as const,
        actionUrl: '/dean/approvals'
      },
      rejected: {
        title: 'Final Approval Rejected',
        message: `You have rejected the final approval for "${clearanceTitle}" submission from ${studentName}.`,
        type: 'error' as const,
        actionUrl: '/dean/approvals'
      }
    };

    const messageData = actionMessages[action];
    await this.createNotification({
      userId: deanId,
      institutionId,
      ...messageData,
      category: 'clearance_workflow',
      relatedEntityType: 'ClearanceSubmission',
      relatedEntityId: studentName
    });
  }

  /**
   * Create admin management notification
   */
  static async createAdminNotification(
    adminId: string,
    institutionId: string,
    action: 'item_created' | 'item_updated' | 'item_deleted' | 'officer_assigned',
    details: {
      clearanceTitle?: string;
      officerName?: string;
    }
  ): Promise<void> {
    const actionMessages = {
      item_created: {
        title: 'Clearance Item Created',
        message: `A new clearance item "${details.clearanceTitle}" has been created.`,
        type: 'success' as const,
        actionUrl: '/admin/clearance'
      },
      item_updated: {
        title: 'Clearance Item Updated',
        message: `Clearance item "${details.clearanceTitle}" has been updated.`,
        type: 'info' as const,
        actionUrl: '/admin/clearance'
      },
      item_deleted: {
        title: 'Clearance Item Deleted',
        message: `Clearance item "${details.clearanceTitle}" has been deleted.`,
        type: 'warning' as const,
        actionUrl: '/admin/clearance'
      },
      officer_assigned: {
        title: 'Officer Assignment Updated',
        message: `Officer "${details.officerName}" has been assigned to clearance item "${details.clearanceTitle}".`,
        type: 'info' as const,
        actionUrl: '/admin/clearance'
      }
    };

    const messageData = actionMessages[action];
    await this.createNotification({
      userId: adminId,
      institutionId,
      ...messageData,
      category: 'clearance_workflow',
      relatedEntityType: 'ClearanceItem',
      relatedEntityId: details.clearanceTitle || details.officerName
    });
  }
}
