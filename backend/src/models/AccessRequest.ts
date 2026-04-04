import mongoose, { Schema, Document } from 'mongoose';

export interface IAccessRequest extends Document {
  email: string;
  fullName: string;
  avatarUrl?: string;
  institutionId: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccessRequestSchema = new Schema<IAccessRequest>({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  institutionId: {
    type: Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  rejectionReason: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound index: one pending request per email per institution
AccessRequestSchema.index({ email: 1, institutionId: 1, status: 1 });

export default mongoose.model<IAccessRequest>('AccessRequest', AccessRequestSchema);
