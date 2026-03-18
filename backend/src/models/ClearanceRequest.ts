import mongoose, { Schema, Document } from "mongoose";

export interface IClearanceRequest extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  institutionId: mongoose.Types.ObjectId;
  termId: mongoose.Types.ObjectId;
  status: "pending" | "in_progress" | "completed" | "rejected";
  finalApprovalDate?: Date;
  createdBy?: mongoose.Types.ObjectId;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ClearanceRequestSchema = new Schema<IClearanceRequest>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
  institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true },
  termId: { type: Schema.Types.ObjectId, ref: "Term", required: true },
  status: {
    type: String,
    enum: ["pending", "in_progress", "completed", "rejected"],
    default: "pending"
  },
  finalApprovalDate: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// A user can have one clearance request per organization per term
ClearanceRequestSchema.index({ organizationId: 1, userId: 1, termId: 1 }, { unique: true });
ClearanceRequestSchema.index({ institutionId: 1, status: 1 });
ClearanceRequestSchema.index({ userId: 1, institutionId: 1 });

export default mongoose.model<IClearanceRequest>("ClearanceRequest", ClearanceRequestSchema);
