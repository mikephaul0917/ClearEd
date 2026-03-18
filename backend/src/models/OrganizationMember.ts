import mongoose, { Schema, Document } from "mongoose";

/**
 * OrganizationMember Entity
 * Manages the many-to-many relationship between Users and Organizations.
 */
export interface IOrganizationMember extends Document {
    organizationId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    institutionId: mongoose.Types.ObjectId; // Denormalized for rapid multi-tenant filtering
    role: "member" | "officer";
    status: "active" | "left" | "removed";
    joinedAt: Date;
    statusChangedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const OrganizationMemberSchema = new Schema<IOrganizationMember>({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    institutionId: {
        type: Schema.Types.ObjectId,
        ref: "Institution",
        required: true
    },
    role: {
        type: String,
        enum: ["member", "officer"],
        default: "member"
    },
    status: {
        type: String,
        enum: ["active", "left", "removed"],
        default: "active"
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    statusChangedAt: {
        type: Date
    }
}, {
    timestamps: true
});

/**
 * Index Strategy
 */

// PREVENT DUPLICATE MEMBERSHIP: A user can only have one membership record per organization.
OrganizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

// Multi-tenant isolation: Optimized filtering for all active memberships within an institution.
OrganizationMemberSchema.index({ institutionId: 1, userId: 1, status: 1 });

// Roster lookups: Optimized for Officers to view members of their organization.
OrganizationMemberSchema.index({ organizationId: 1, status: 1, role: 1 });

export default mongoose.model<IOrganizationMember>("OrganizationMember", OrganizationMemberSchema);
