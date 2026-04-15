import mongoose, { Schema, Document } from "mongoose";

/**
 * ClearanceRequirement Entity
 * Acts like a Google Classroom assignment. Created by an Officer within an Organization.
 * Defines what a student needs to submit/fulfill to get cleared for this specific item.
 */
export interface IClearanceRequirement extends Document {
    title: string;
    description: string;
    instructions?: string; // Detailed instructions for the student
    topic?: string; // Optional grouping topic
    options?: string[]; // Multiple choice options
    dueDate?: Date; // Optional due date for the requirement
    points?: string; // Optional grading points
    attachments: {
        name: string;
        url: string;
        type: string;
    }[]; // Officer-provided templates or reference docs
    requiredFiles?: string[]; // Types of files student must upload (e.g. "Receipt", "ID")
    isMandatory: boolean;
    isAnnouncement: boolean; // True if it's an informational post, not a requirement
    type?: 'requirement' | 'announcement' | 'form' | 'poll' | 'material';
    assignedTo?: mongoose.Types.ObjectId[]; // Specific members assigned. If empty/undefined, means all members
    officeId?: mongoose.Types.ObjectId; // Link to institutional office
    organizationId: mongoose.Types.ObjectId;
    institutionId: mongoose.Types.ObjectId;
    termId: mongoose.Types.ObjectId; // Link to academic term
    createdBy: mongoose.Types.ObjectId; // The Clearance Officer
    isReviewed: boolean; // Manual override for the To Review / Reviewed tabs
    isActive: boolean;
    order: number; // For manual sequencing in the UI
    createdAt: Date;
    updatedAt: Date;
}

const ClearanceRequirementSchema = new Schema<IClearanceRequirement>({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    instructions: {
        type: String,
        trim: true
    },
    topic: {
        type: String,
        trim: true,
        maxlength: 100
    },
    options: [{ type: String }],
    dueDate: {
        type: Date
    },
    points: {
        type: String,
        trim: true
    },
    attachments: [{
        name: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String }
    }],
    requiredFiles: [{ type: String }],
    assignedTo: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    isMandatory: { type: Boolean, default: true },
    isAnnouncement: { type: Boolean, default: false },
    type: { type: String, enum: ['requirement', 'announcement', 'form', 'poll', 'material'], default: 'requirement' },
    officeId: {
        type: Schema.Types.ObjectId,
        ref: "ClearanceOffice"
    },
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
        required: true
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
    isReviewed: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes for performance
ClearanceRequirementSchema.index({ organizationId: 1, termId: 1, isActive: 1 });
ClearanceRequirementSchema.index({ organizationId: 1, order: 1 });
ClearanceRequirementSchema.index({ termId: 1 });
ClearanceRequirementSchema.index({ createdBy: 1 });

export default mongoose.model<IClearanceRequirement>("ClearanceRequirement", ClearanceRequirementSchema);
