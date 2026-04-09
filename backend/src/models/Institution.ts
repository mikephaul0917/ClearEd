import mongoose, { Schema, Document } from "mongoose";

/**
 * Institution Entity
 * Root entity for the multi-tenant SaaS E-Clearance System.
 */
export interface IInstitution extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  domain: string; // The academic email domain (e.g., 'university.edu.ph')
  department?: string; // e.g., 'Department of Education'
  region?: string; // e.g., 'Region V'
  division?: string; // e.g., 'Division of Camarines Sur'
  address: string;
  contactNumber: string;
  email: string; // Official contact email
  administratorName: string;
  administratorPosition: string;
  status: "pending" | "approved" | "rejected" | "suspended" | "deleted";
  settings?: {
    allowStudentRegistration: boolean;
    requireEmailVerification: boolean;
    maxUsers?: number;
  };
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  suspendedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InstitutionSchema = new Schema<IInstitution>({
  name: { type: String, required: true, trim: true },
  domain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  department: { type: String, trim: true },
  region: { type: String, trim: true },
  division: { type: String, trim: true },
  address: { type: String, required: true, trim: true },
  contactNumber: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  administratorName: { type: String, required: true, trim: true },
  administratorPosition: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "suspended", "deleted"],
    default: "pending"
  },
  settings: {
    allowStudentRegistration: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: true },
    maxUsers: { type: Number }
  },
  approvedAt: { type: Date },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  suspendedAt: { type: Date },
  deletedAt: { type: Date }
}, {
  timestamps: true // Audit-friendly: automatically adds createdAt and updatedAt
});

/**
 * Index Definitions
 */

// Primary index for domain-based multi-tenant routing (Google Classroom behavior)
// Primary index for domain-based multi-tenant routing (index automatically created by unique: true)

// Index for high-performance status filtering (e.g., block suspended institutions in middleware)
InstitutionSchema.index({ status: 1 });

export const Institution = mongoose.model<IInstitution>("Institution", InstitutionSchema);
export default Institution;
