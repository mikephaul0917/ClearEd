import mongoose, { Schema, Document } from "mongoose";

export interface IFileSubmission {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

/**
 * ClearanceSubmission Entity
 * Represents a student's submission for a specific clearance requirement.
 * Tracks the review process (pending, approved, rejected, etc.).
 */
export interface IClearanceSubmission extends Document {
  userId: mongoose.Types.ObjectId; // The student
  clearanceRequirementId: mongoose.Types.ObjectId; // The requirement being fulfilled
  clearanceRequestId: mongoose.Types.ObjectId; // Parent request in the org/term
  organizationId: mongoose.Types.ObjectId;
  institutionId: mongoose.Types.ObjectId;
  files: IFileSubmission[]; // References to uploaded files
  status: "pending" | "approved" | "rejected" | "resubmission_required";
  reviewedBy?: mongoose.Types.ObjectId; // Officer who reviewed this
  reviewedAt?: Date;
  notes?: string; // Review notes from officer
  rejectionReason?: string;
  studentNotes?: string; // Notes from student during submission
  submittedAt: Date;
  lastResubmittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FileSubmissionSchema = new Schema<IFileSubmission>({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const ClearanceSubmissionSchema = new Schema<IClearanceSubmission>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  clearanceRequirementId: {
    type: Schema.Types.ObjectId,
    ref: "ClearanceRequirement",
    required: true
  },
  clearanceRequestId: {
    type: Schema.Types.ObjectId,
    ref: "ClearanceRequest",
    required: true
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true
  },
  institutionId: {
    type: Schema.Types.ObjectId,
    ref: "Institution",
    required: true
  },
  files: [FileSubmissionSchema],
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "resubmission_required"],
    default: "pending"
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  reviewedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  studentNotes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  lastResubmittedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Enforce one active submission per user per requirement for a given request
ClearanceSubmissionSchema.index({ clearanceRequestId: 1, clearanceRequirementId: 1, userId: 1 }, { unique: true });
ClearanceSubmissionSchema.index({ organizationId: 1, status: 1 });
ClearanceSubmissionSchema.index({ reviewedBy: 1 });

export default mongoose.model<IClearanceSubmission>("ClearanceSubmission", ClearanceSubmissionSchema);
