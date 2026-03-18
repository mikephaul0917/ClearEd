import mongoose, { Schema, Document } from "mongoose";

/**
 * AuditLog Entity
 * Tracks sensitive system actions for monitoring, accountability, and security auditing.
 * Scoped by institution to support multi-tenant filtering.
 */
export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId; // User who performed the action
  institutionId?: mongoose.Types.ObjectId; // Scoped institution (optional for global super-admin actions)
  action: string; // e.g., "login_attempt", "org_join", "clearance_approved", "role_changed"
  category: "auth" | "user_management" | "organization_management" | "clearance_workflow" | "institution_management" | "system";
  resource: string; // The type of object affected (e.g., "User", "Organization", "ClearanceSubmission")
  resourceId?: mongoose.Types.ObjectId; // Specific ID of the resource
  details: any; // Context-specific data (e.g., old/new values, IP address)
  severity: "low" | "medium" | "high" | "critical";
  ipAddress: string;
  userAgent?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  institutionId: {
    type: Schema.Types.ObjectId,
    ref: "Institution"
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ["auth", "user_management", "organization_management", "clearance_workflow", "institution_management", "system", "announcement_management", "clearance", "security", "announcement"],
    required: true
  },
  resource: {
    type: String,
    required: true,
    trim: true
  },
  resourceId: {
    type: Schema.Types.ObjectId
  },
  details: {
    type: Schema.Types.Mixed,
    default: {}
  },
  severity: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "low"
  },
  ipAddress: {
    type: String,
    required: true,
    default: "unknown"
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for multi-tenant filtering and reporting
AuditLogSchema.index({ institutionId: 1, timestamp: -1 });
AuditLogSchema.index({ category: 1, action: 1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });

// Automatically delete logs after 1 year to manage database size
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
export default AuditLog;
