import mongoose, { Schema, Document } from 'mongoose';

export interface IInstitutionRequest extends Document {
  institutionName: string;
  academicDomain: string;
  physicalAddress: string;
  contactNumber: string;
  administratorName: string;
  administratorPosition: string;
  administratorEmail: string;
  status: 'PENDING_VERIFICATION' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'RETURNED_FOR_CLARIFICATION';
  verificationToken?: string;
  verificationTokenExpires?: Date;
  verifiedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  clarificationRequest?: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
  
  // Instance methods
  approve(adminId: mongoose.Types.ObjectId, notes?: string): Promise<IInstitutionRequest>;
  reject(adminId: mongoose.Types.ObjectId, reason: string): Promise<IInstitutionRequest>;
  requestClarification(adminId: mongoose.Types.ObjectId, clarification: string): Promise<IInstitutionRequest>;
  verifyEmail(): Promise<IInstitutionRequest>;
}

// Static methods interface
export interface IInstitutionRequestModel extends mongoose.Model<IInstitutionRequest> {
  findPending(): Promise<IInstitutionRequest[]>;
  findByVerificationToken(token: string): Promise<IInstitutionRequest | null>;
}

const InstitutionRequestSchema: Schema = new Schema({
  institutionName: {
    type: String,
    required: [true, 'Institution name is required'],
    trim: true,
    maxlength: [200, 'Institution name cannot exceed 200 characters']
  },
  academicDomain: {
    type: String,
    required: [true, 'Academic domain is required'],
    trim: true,
    lowercase: true,
    validate: {
      validator: function(domain: string) {
        // Basic domain validation
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
        return domainRegex.test(domain);
      },
      message: 'Please enter a valid domain name'
    }
  },
  physicalAddress: {
    type: String,
    required: [true, 'Physical address is required'],
    trim: true,
    maxlength: [500, 'Physical address cannot exceed 500 characters']
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    validate: {
      validator: function(phone: string) {
        // Basic phone validation - can be enhanced based on requirements
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
      },
      message: 'Please enter a valid contact number'
    }
  },
  administratorName: {
    type: String,
    required: [true, 'Administrator name is required'],
    trim: true,
    maxlength: [100, 'Administrator name cannot exceed 100 characters']
  },
  administratorPosition: {
    type: String,
    required: [true, 'Administrator position is required'],
    trim: true,
    maxlength: [100, 'Administrator position cannot exceed 100 characters']
  },
  administratorEmail: {
    type: String,
    required: [true, 'Administrator email is required'],
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  status: {
    type: String,
    enum: ['PENDING_VERIFICATION', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RETURNED_FOR_CLARIFICATION'],
    default: 'PENDING_APPROVAL',
    index: true
  },
  verificationToken: {
    type: String,
    select: false // Don't include in queries by default for security
  },
  verificationTokenExpires: {
    type: Date,
    select: false
  },
  verifiedAt: Date,
  reviewedAt: Date,
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    select: false
  },
  rejectionReason: {
    type: String,
    maxlength: [1000, 'Rejection reason cannot exceed 1000 characters']
  },
  clarificationRequest: {
    type: String,
    maxlength: [1000, 'Clarification request cannot exceed 1000 characters']
  },
  ipAddress: String,
  userAgent: String,
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and queries (academicDomain and status are automatically indexed by schema definitions)
InstitutionRequestSchema.index({ createdAt: -1 });
InstitutionRequestSchema.index({ verificationToken: 1 });
InstitutionRequestSchema.index(
  { academicDomain: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { status: { $ne: 'REJECTED' } } 
  }
);

// Virtual for formatted domain
InstitutionRequestSchema.virtual('formattedDomain').get(function(this: IInstitutionRequest) {
  return this.academicDomain && typeof this.academicDomain === 'string' && this.academicDomain.startsWith('.') 
    ? this.academicDomain 
    : this.academicDomain;
});

// Pre-save middleware to ensure domain doesn't have leading dot
InstitutionRequestSchema.pre('save', function(next: any) {
  if (this.academicDomain && typeof this.academicDomain === 'string' && this.academicDomain.startsWith('.')) {
    this.academicDomain = this.academicDomain.substring(1);
  }
  next();
});

// Static method to find pending requests
InstitutionRequestSchema.statics.findPending = function() {
  return this.find({ 
    status: { $in: ['PENDING_VERIFICATION', 'PENDING_APPROVAL'] }
  }).sort({ createdAt: -1 });
};

// Static method to find by verification token
InstitutionRequestSchema.statics.findByVerificationToken = function(token: string) {
  return this.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: new Date() },
    status: 'PENDING_VERIFICATION'
  }).select('+verificationToken +verificationTokenExpires');
};

// Instance method to approve request
InstitutionRequestSchema.methods.approve = function(adminId: mongoose.Types.ObjectId, notes?: string) {
  this.status = 'APPROVED';
  this.reviewedAt = new Date();
  this.reviewedBy = adminId;
  if (notes) this.notes = notes;
  return this.save();
};

// Instance method to reject request
InstitutionRequestSchema.methods.reject = function(adminId: mongoose.Types.ObjectId, reason: string) {
  this.status = 'REJECTED';
  this.reviewedAt = new Date();
  this.reviewedBy = adminId;
  this.rejectionReason = reason;
  return this.save();
};

// Instance method to request clarification
InstitutionRequestSchema.methods.requestClarification = function(adminId: mongoose.Types.ObjectId, clarification: string) {
  this.status = 'RETURNED_FOR_CLARIFICATION';
  this.reviewedAt = new Date();
  this.reviewedBy = adminId;
  this.clarificationRequest = clarification;
  return this.save();
};

// Instance method to verify email
InstitutionRequestSchema.methods.verifyEmail = function() {
  this.status = 'PENDING_APPROVAL';
  this.verifiedAt = new Date();
  this.verificationToken = undefined;
  this.verificationTokenExpires = undefined;
  return this.save();
};

export const InstitutionRequest = mongoose.model<IInstitutionRequest, IInstitutionRequestModel>('InstitutionRequest', InstitutionRequestSchema);
