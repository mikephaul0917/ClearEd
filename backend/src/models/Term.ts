import mongoose, { Schema, Document } from "mongoose";

export interface ITerm extends Document {
  name?: string;
  academicYear?: string;
  semester?: string;
  institutionId: mongoose.Types.ObjectId;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TermSchema = new Schema<ITerm>({
  name: { type: String, trim: true },
  academicYear: { type: String, trim: true },
  semester: { type: String, trim: true },
  institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true },
  isActive: { type: Boolean, default: false },
  startDate: { type: Date },
  endDate: { type: Date }
}, { timestamps: true });

// Only one term can be active per institution at a time
TermSchema.index({ institutionId: 1, isActive: 1 });
TermSchema.index({ institutionId: 1, academicYear: 1, semester: 1 });

export default mongoose.model<ITerm>("Term", TermSchema);
