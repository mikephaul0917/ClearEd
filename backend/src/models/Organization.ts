import mongoose, { Schema, Document } from "mongoose";

/**
 * Organization Entity (Google Classroom style)
 * Represents a class, department, or group within an Institution.
 */
export interface IOrganization extends Document {
    name: string;
    description?: string;
    joinCode: string; // Unique alphanumeric code
    code?: string;    // Institutional shorthand (e.g., "REG")
    signatoryName?: string;
    isActive: boolean;
    order: number;
    isFinal: boolean;
    status: "active" | "archived";
    institutionId: mongoose.Types.ObjectId;
    termId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    themeColor?: string;
    headerImage?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Generates a random 6-character alphanumeric join code.
 */
const generateJoinCode = (): string => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const OrganizationSchema = new Schema<IOrganization>({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    joinCode: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        default: generateJoinCode
    },
    code: {
        type: String,
        trim: true,
        uppercase: true
    },
    signatoryName: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ["active", "archived"],
        default: "active"
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    isFinal: {
        type: Boolean,
        default: false
    },
    institutionId: {
        type: Schema.Types.ObjectId,
        ref: "Institution",
        required: true
    },
    termId: {
        type: Schema.Types.ObjectId,
        ref: "Term",
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    themeColor: {
        type: String,
        trim: true
    },
    headerImage: {
        type: String
    }
}, {
    timestamps: true
});

/**
 * Index Strategy
 */

// Global unique join code for student enrollment (Google Classroom behavior)
// This ensures that a single code points to exactly one organization across the entire system.
OrganizationSchema.index({ joinCode: 1 }, { unique: true });

// Multi-tenant filtering for active/archived organizations
OrganizationSchema.index({ institutionId: 1, status: 1 });

// Filtering by academic term
OrganizationSchema.index({ institutionId: 1, termId: 1 });

export default mongoose.model<IOrganization>("Organization", OrganizationSchema);
