import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  type: 'maintenance' | 'policy' | 'security' | 'general' | 'urgent';
  priority: 'low' | 'medium' | 'high' | 'critical';
  targetAudience: 'all' | 'institutions' | 'students' | 'admins' | 'super_admin';
  targetInstitutions?: mongoose.Types.ObjectId[];
  isActive: boolean;
  scheduledAt?: Date;
  expiresAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  dismissCount: number;
  requiresAcknowledgment: boolean;
  attachments?: string[];
  tags?: string[];
}

const AnnouncementSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Announcement title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Announcement content is required'],
    trim: true,
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  type: {
    type: String,
    required: true,
    enum: ['maintenance', 'policy', 'security', 'general', 'urgent'],
    default: 'general'
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  targetAudience: {
    type: String,
    required: true,
    enum: ['all', 'institutions', 'students', 'admins', 'super_admin'],
    default: 'all'
  },
  targetInstitutions: [{
    type: Schema.Types.ObjectId,
    ref: 'Institution'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  scheduledAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  dismissCount: {
    type: Number,
    default: 0
  },
  requiresAcknowledgment: {
    type: Boolean,
    default: false
  },
  attachments: [{
    type: String
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
AnnouncementSchema.index({ isActive: 1, scheduledAt: 1, expiresAt: 1 });
AnnouncementSchema.index({ targetAudience: 1, isActive: 1 });
AnnouncementSchema.index({ type: 1, priority: 1, isActive: 1 });
AnnouncementSchema.index({ createdAt: -1 });

// Virtual for checking if announcement is currently active
AnnouncementSchema.virtual('isCurrentlyActive').get(function() {
  if (!this.isActive) return false;
  
  const now = new Date();
  
  // Check if scheduled for future
  if (this.scheduledAt && this.scheduledAt > now) {
    return false;
  }
  
  // Check if expired
  if (this.expiresAt && this.expiresAt < now) {
    return false;
  }
  
  return true;
});

// Method to check if announcement is visible to specific user
AnnouncementSchema.methods.isVisibleToUser = function(user: any) {
  if (!this.isCurrentlyActive) return false;
  
  // Super admin can see all announcements
  if (user?.role === 'super_admin') return true;
  
  // Check target audience
  switch (this.targetAudience) {
    case 'all':
      return true;
    case 'institutions':
      return ['admin', 'dean', 'officer'].includes(user?.role);
    case 'students':
      return user?.role === 'student';
    case 'admins':
      return ['admin', 'dean', 'officer'].includes(user?.role);
    case 'super_admin':
      return user?.role === 'super_admin';
    default:
      return false;
  }
};

// Pre-save middleware to validate dates
AnnouncementSchema.pre('save', function(next) {
  if (this.scheduledAt && this.expiresAt && this.scheduledAt >= this.expiresAt) {
    return next(new Error('Scheduled date must be before expiration date'));
  }
  
  if (this.expiresAt && this.expiresAt <= new Date()) {
    return next(new Error('Expiration date must be in the future'));
  }
  
  next();
});

export const Announcement = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
