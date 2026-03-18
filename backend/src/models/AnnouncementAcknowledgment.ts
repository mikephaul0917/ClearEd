import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncementAcknowledgment extends Document {
  announcement: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  institution?: mongoose.Types.ObjectId;
  acknowledgedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

const AnnouncementAcknowledgmentSchema: Schema = new Schema({
  announcement: {
    type: Schema.Types.ObjectId,
    ref: 'Announcement',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  institution: {
    type: Schema.Types.ObjectId,
    ref: 'Institution'
  },
  acknowledgedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate acknowledgments
AnnouncementAcknowledgmentSchema.index({ announcement: 1, user: 1 }, { unique: true });
AnnouncementAcknowledgmentSchema.index({ user: 1, acknowledgedAt: -1 });

export const AnnouncementAcknowledgment = mongoose.model<IAnnouncementAcknowledgment>('AnnouncementAcknowledgment', AnnouncementAcknowledgmentSchema);
