import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
  requirementId: mongoose.Types.ObjectId; // References ClearanceRequirement
  userId: mongoose.Types.ObjectId; // References User
  isPrivate: boolean;
  studentId?: mongoose.Types.ObjectId; // For private comments, refers to the student
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
  requirementId: { type: Schema.Types.ObjectId, ref: 'ClearanceRequirement', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isPrivate: { type: Boolean, default: false },
  studentId: { type: Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: true, trim: true, maxlength: 1000 }
}, {
  timestamps: true
});

CommentSchema.index({ requirementId: 1, createdAt: 1 });

export default mongoose.model<IComment>("Comment", CommentSchema);
