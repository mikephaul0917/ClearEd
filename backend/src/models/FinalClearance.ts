import mongoose, { Schema, Document } from "mongoose";

export interface IFinalClearance extends Document {
  userId: mongoose.Types.ObjectId;
  institutionId: mongoose.Types.ObjectId;
  termId: mongoose.Types.ObjectId;
  status: "pending" | "approved" | "rejected";
  submittedAt: Date;
  reviewedAt?: Date;
  notes?: string;
  signatureUrl?: string; // Dean's signature
  createdAt: Date;
  updatedAt: Date;
}

const FinalClearanceSchema = new Schema<IFinalClearance>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true },
  termId: { type: Schema.Types.ObjectId, ref: "Term", required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  notes: { type: String },
  signatureUrl: { type: String }
}, { timestamps: true });

// A user can only have one final clearance per term per institution
FinalClearanceSchema.index({ userId: 1, institutionId: 1, termId: 1 }, { unique: true });
FinalClearanceSchema.index({ institutionId: 1, status: 1 });

export default mongoose.model<IFinalClearance>("FinalClearance", FinalClearanceSchema);
