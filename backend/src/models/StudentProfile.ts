import mongoose, { Schema, Document } from "mongoose";

export interface IStudentProfile extends Document {
  userId: mongoose.Types.ObjectId;
  familyName?: string;
  firstName?: string;
  middleName?: string;
  studentNumber?: string;
  course: string;
  year: string;
  semester: string;
  academicYear: string;
  institutionId: mongoose.Types.ObjectId;
  reqValidId?: boolean;
  reqAdviserForm?: boolean;
  reqOrgForm?: boolean;
}

const StudentProfileSchema = new Schema<IStudentProfile>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true },
  familyName: { type: String },
  firstName: { type: String },
  middleName: { type: String },
  studentNumber: { type: String },
  course: { type: String, required: true },
  year: { type: String, required: true },
  semester: { type: String, required: true },
  academicYear: { type: String, required: true }
  , reqValidId: { type: Boolean, default: false }
  , reqAdviserForm: { type: Boolean, default: false }
  , reqOrgForm: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IStudentProfile>("StudentProfile", StudentProfileSchema);
