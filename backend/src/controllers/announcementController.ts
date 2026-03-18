import { Request, Response } from 'express';
import { Announcement, IAnnouncement } from '../models/Announcement';
import { AnnouncementAcknowledgment } from '../models/AnnouncementAcknowledgment';
import { AuditLog } from '../models/AuditLog';
import { Institution } from '../models/Institution';

// Get all announcements for Super Admin
export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const now = new Date();
    
    const filters: any = {};
    
    // Filter by type
    if (req.query.type) {
      filters.type = req.query.type;
    }
    
    // Filter by priority
    if (req.query.priority) {
      filters.priority = req.query.priority;
    }
    
    // Filter by status
    if (req.query.status === 'active') {
      // Currently active: same logic as getAnnouncementStats "active"
      filters.isActive = true;
      filters.$and = [
        {
          $or: [
            { scheduledAt: null },
            { scheduledAt: { $lte: now } }
          ]
        },
        {
          $or: [
            { expiresAt: null },
            { expiresAt: { $gte: now } }
          ]
        }
      ];
    } else if (req.query.status === 'scheduled') {
      // Scheduled for the future
      filters.isActive = true;
      filters.scheduledAt = { $gt: now };
    } else if (req.query.status === 'expired') {
      // Already expired
      filters.isActive = true;
      filters.expiresAt = { $lt: now };
    } else if (req.query.status === 'inactive') {
      // Explicitly inactive (drafts, disabled)
      filters.isActive = false;
    }
    
    // Filter by target audience
    if (req.query.targetAudience) {
      filters.targetAudience = req.query.targetAudience;
    }
    
    // Search by title or content
    if (req.query.search) {
      filters.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    const announcements = await Announcement.find(filters)
      .populate('createdBy', 'email fullName')
      .populate('targetInstitutions', 'name domain')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Announcement.countDocuments(filters);
    
    res.json({
      success: true,
      data: {
        announcements,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: error.message
    });
  }
};

// Get single announcement by ID
export const getAnnouncementById = async (req: Request, res: Response) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'email fullName')
      .populate('targetInstitutions', 'name domain');
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    res.json({
      success: true,
      data: announcement
    });
  } catch (error: any) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcement',
      error: error.message
    });
  }
};

// Create new announcement
export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    // Handle both file upload and regular form data
    let title, content, type, priority, targetAudience, targetInstitutions, scheduledAt, expiresAt, requiresAcknowledgment, tags;
    
    // If files were uploaded, use req.body (from multer)
    if (req.uploadedFiles) {
      title = req.body.title;
      content = req.body.content;
      type = req.body.type;
      priority = req.body.priority;
      targetAudience = req.body.targetAudience;
      targetInstitutions = req.body.targetInstitutions ? JSON.parse(req.body.targetInstitutions) : [];
      scheduledAt = req.body.scheduledAt;
      expiresAt = req.body.expiresAt;
      requiresAcknowledgment = req.body.requiresAcknowledgment === 'true';
      tags = req.body.tags ? JSON.parse(req.body.tags) : [];
    } else {
      // Regular JSON data
      const data = req.body;
      title = data.title;
      content = data.content;
      type = data.type;
      priority = data.priority;
      targetAudience = data.targetAudience;
      targetInstitutions = data.targetInstitutions || [];
      scheduledAt = data.scheduledAt;
      expiresAt = data.expiresAt;
      requiresAcknowledgment = data.requiresAcknowledgment;
      tags = data.tags || [];
    }
    
    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }
    
    // Validate target institutions if specified
    if (targetInstitutions && targetInstitutions.length > 0) {
      const institutions = await Institution.find({ _id: { $in: targetInstitutions } });
      if (institutions.length !== targetInstitutions.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more target institutions are invalid'
        });
      }
    }
    
    // Handle attachments
    const attachments = req.uploadedFiles ? req.uploadedFiles.map(file => file.filename) : [];
    
    const announcement = new Announcement({
      title,
      content,
      type: type || 'general',
      priority: priority || 'medium',
      targetAudience: targetAudience || 'all',
      targetInstitutions: targetInstitutions || [],
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      requiresAcknowledgment: requiresAcknowledgment || false,
      attachments: attachments,
      tags: tags || [],
      createdBy: req.user?.id
    });
    
    await announcement.save();
    
    // Populate for response
    await announcement.populate('createdBy', 'email fullName');
    await announcement.populate('targetInstitutions', 'name domain');
    
    // Log the action
    await AuditLog.create({
      userId: req.user?.id,
      action: 'CREATE_ANNOUNCEMENT',
      resource: 'Announcement',
      details: `Created announcement: ${title}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      severity: priority === 'critical' || priority === 'high' ? 'high' : 'medium',
      category: 'announcement_management'
    });
    
    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement
    });
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create announcement',
      error: error.message
    });
  }
};

// Update announcement
export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    // Handle both file upload and regular form data
    let title, content, type, priority, targetAudience, targetInstitutions, isActive, scheduledAt, expiresAt, requiresAcknowledgment, tags, attachments;
    
    // If files were uploaded, use req.body (from multer)
    if (req.uploadedFiles) {
      title = req.body.title;
      content = req.body.content;
      type = req.body.type;
      priority = req.body.priority;
      targetAudience = req.body.targetAudience;
      targetInstitutions = req.body.targetInstitutions ? JSON.parse(req.body.targetInstitutions) : [];
      isActive = req.body.isActive === 'true';
      scheduledAt = req.body.scheduledAt;
      expiresAt = req.body.expiresAt;
      requiresAcknowledgment = req.body.requiresAcknowledgment === 'true';
      tags = req.body.tags ? JSON.parse(req.body.tags) : [];
    } else {
      // Regular JSON data
      const data = req.body;
      title = data.title;
      content = data.content;
      type = data.type;
      priority = data.priority;
      targetAudience = data.targetAudience;
      targetInstitutions = data.targetInstitutions || [];
      isActive = data.isActive;
      scheduledAt = data.scheduledAt;
      expiresAt = data.expiresAt;
      requiresAcknowledgment = data.requiresAcknowledgment;
      tags = data.tags || [];
      attachments = data.attachments;
    }
    
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    // Validate target institutions if specified
    if (targetInstitutions && targetInstitutions.length > 0) {
      const institutions = await Institution.find({ _id: { $in: targetInstitutions } });
      if (institutions.length !== targetInstitutions.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more target institutions are invalid'
        });
      }
    }
    
    // Update fields
    if (title !== undefined) announcement.title = title;
    if (content !== undefined) announcement.content = content;
    if (type !== undefined) announcement.type = type;
    if (priority !== undefined) announcement.priority = priority;
    if (targetAudience !== undefined) announcement.targetAudience = targetAudience;
    if (targetInstitutions !== undefined) announcement.targetInstitutions = targetInstitutions;
    if (isActive !== undefined) announcement.isActive = isActive;
    if (scheduledAt !== undefined) announcement.scheduledAt = scheduledAt ? new Date(scheduledAt) : undefined;
    if (expiresAt !== undefined) announcement.expiresAt = expiresAt ? new Date(expiresAt) : undefined;
    if (requiresAcknowledgment !== undefined) announcement.requiresAcknowledgment = requiresAcknowledgment;
    if (tags !== undefined) announcement.tags = tags;
    
    // Handle attachments (update with new files if uploaded)
    if (req.uploadedFiles) {
      const newAttachments = req.uploadedFiles.map(file => file.filename);
      // Replace existing attachments with new ones
      announcement.attachments = newAttachments;
    } else if (attachments !== undefined) {
      announcement.attachments = attachments;
    }
    
    await announcement.save();
    
    // Populate for response
    await announcement.populate('createdBy', 'email fullName');
    await announcement.populate('targetInstitutions', 'name domain');
    
    // Log the action
    await AuditLog.create({
      userId: req.user?.id,
      action: 'UPDATE_ANNOUNCEMENT',
      resource: 'Announcement',
      details: `Updated announcement: ${announcement.title}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      severity: 'medium',
      category: 'announcement_management'
    });
    
    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement
    });
  } catch (error: any) {
    console.error('Error updating announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update announcement',
      error: error.message
    });
  }
};

// Delete announcement
export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    const title = announcement.title;
    await Announcement.findByIdAndDelete(req.params.id);
    
    // Delete related acknowledgments
    await AnnouncementAcknowledgment.deleteMany({ announcement: req.params.id });
    
    // Log the action
    await AuditLog.create({
      userId: req.user?.id,
      action: 'DELETE_ANNOUNCEMENT',
      resource: 'Announcement',
      details: `Deleted announcement: ${title}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      severity: 'medium',
      category: 'announcement_management'
    });
    
    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete announcement',
      error: error.message
    });
  }
};

// Get active announcements for users
export const getActiveAnnouncements = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    
    // Find announcements that are currently active
    const announcements = await Announcement.find({
      isActive: true,
      $and: [
        {
          $or: [
            { scheduledAt: null },
            { scheduledAt: { $lte: now } }
          ]
        },
        {
          $or: [
            { expiresAt: null },
            { expiresAt: { $gte: now } }
          ]
        }
      ]
    })
    .populate('createdBy', 'fullName')
    .sort({ priority: -1, createdAt: -1 });
    
    // Filter announcements based on user role and visibility
    const visibleAnnouncements = announcements.filter(announcement => {
      // For public access, only show announcements with targetAudience 'all'
      if (!req.user) {
        return announcement.targetAudience === 'all';
      }
      // For authenticated users, check visibility
      return (announcement as any).isVisibleToUser(req.user);
    });
    
    // Get acknowledgments for this user if announcements require acknowledgment
    const acknowledgments = new Set();
    if (req.user && visibleAnnouncements.some(a => a.requiresAcknowledgment)) {
      const userAcknowledgments = await AnnouncementAcknowledgment.find({
        user: req.user.id
      }).select('announcement');
      
      userAcknowledgments.forEach(ack => {
        acknowledgments.add(ack.announcement.toString());
      });
    }
    
    // Mark announcements as acknowledged or not
    const announcementsWithStatus = visibleAnnouncements.map(announcement => ({
      ...announcement.toObject(),
      isAcknowledged: acknowledgments.has((announcement as any)._id.toString())
    }));
    
    res.json({
      success: true,
      data: announcementsWithStatus
    });
  } catch (error: any) {
    console.error('Error fetching active announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: error.message
    });
  }
};

// Acknowledge announcement
export const acknowledgeAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    if (!announcement.requiresAcknowledgment) {
      return res.status(400).json({
        success: false,
        message: 'This announcement does not require acknowledgment'
      });
    }
    
    // Check if already acknowledged
    const existingAcknowledgment = await AnnouncementAcknowledgment.findOne({
      announcement: id,
      user: req.user?.id
    });
    
    if (existingAcknowledgment) {
      return res.status(400).json({
        success: false,
        message: 'Announcement already acknowledged'
      });
    }
    
    // Create acknowledgment
    await AnnouncementAcknowledgment.create({
      announcement: id,
      user: req.user?.id,
      institution: req.user?.institutionId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Increment dismiss count
    await Announcement.findByIdAndUpdate(id, {
      $inc: { dismissCount: 1 }
    });
    
    res.json({
      success: true,
      message: 'Announcement acknowledged successfully'
    });
  } catch (error: any) {
    console.error('Error acknowledging announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge announcement',
      error: error.message
    });
  }
};

// Get announcement statistics
export const getAnnouncementStats = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    
    const stats = await Promise.all([
      // Total announcements
      Announcement.countDocuments(),
      
      // Active announcements
      Announcement.countDocuments({
        isActive: true,
        $and: [
          {
            $or: [
              { scheduledAt: null },
              { scheduledAt: { $lte: now } }
            ]
          },
          {
            $or: [
              { expiresAt: null },
              { expiresAt: { $gte: now } }
            ]
          }
        ]
      }),
      
      // Scheduled announcements
      Announcement.countDocuments({
        isActive: true,
        scheduledAt: { $gt: now }
      }),
      
      // Expired announcements
      Announcement.countDocuments({
        isActive: true,
        expiresAt: { $lt: now }
      }),
      
      // By type
      Announcement.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      
      // By priority
      Announcement.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ])
    ]);
    
    res.json({
      success: true,
      data: {
        total: stats[0],
        active: stats[1],
        scheduled: stats[2],
        expired: stats[3],
        byType: stats[4],
        byPriority: stats[5]
      }
    });
  } catch (error: any) {
    console.error('Error fetching announcement stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcement statistics',
      error: error.message
    });
  }
};
