import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

/**
 * User Entity
 * Represents an individual user within the multi-tenant system.
 * Scoped by institutionId for data isolation.
 */
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username?: string;
  email: string;
  password: string;
  fullName: string;
  role: "student" | "officer" | "dean" | "admin" | "super_admin";
  institutionId?: mongoose.Types.ObjectId;
  status: "active" | "locked" | "invited";
  enabled: boolean;
  failedLoginAttempts: number;
  lockUntil?: Date;
  lastLoginAt?: Date;
  authProvider: 'local' | 'google';
  requiresPasswordSetup: boolean;
  emailVerified: boolean;
  invitedBy?: mongoose.Types.ObjectId;
  invitedAt?: Date;
  lockedAt?: Date;
  lockReason?: string;
  lockedBy?: mongoose.Types.ObjectId;
  accessKey?: string;
  isActive: boolean;
  organizationId?: mongoose.Types.ObjectId;
  signatureUrl?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ["student", "officer", "dean", "admin", "super_admin"],
    default: "student"
  },
  institutionId: {
    type: Schema.Types.ObjectId,
    ref: "Institution",
    required: function () { return this.role !== 'super_admin'; }
  },
  status: {
    type: String,
    enum: ["active", "locked", "invited"],
    default: "active"
  },
  enabled: {
    type: Boolean,
    default: true
  },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  lastLoginAt: { type: Date },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  requiresPasswordSetup: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  invitedAt: { type: Date },
  lockedAt: { type: Date },
  lockReason: { type: String },
  lockedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  accessKey: { type: String },
  isActive: {
    type: Boolean,
    default: true
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: "Organization"
  },
  signatureUrl: {
    type: String
  },
  avatarUrl: {
    type: String
  }
}, {
  timestamps: true
});

/**
 * Pre-save Middleware: Password Hashing
 */
UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

/**
 * Instance Method: Password Comparison
 */
UserSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

/**
 * Index Strategy
 */

// Unique email lookup for authentication
// Unique email lookup for authentication (index automatically created by unique: true)

// Multi-tenant role filtering (Optimized for admin/staff lookups)
UserSchema.index({ institutionId: 1, role: 1 });

// Multi-tenant status monitoring (Optimized for active user counts)
UserSchema.index({ institutionId: 1, status: 1 });

export default mongoose.model<IUser>("User", UserSchema);
