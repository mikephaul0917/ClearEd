import mongoose, { Schema, Document } from "mongoose";

/**
 * ClearanceReview Entity
 * Tracks formal decisions made by Officers or Deans on a student's submission.
 * Supports multi-level approval flow (e.g., Officer sign-off followed by Dean approval).
 */
export interface IClearanceReview extends Document {
    submissionId: mongoose.Types.ObjectId;
    reviewerId: mongoose.Types.ObjectId;
    decision: "approved" | "rejected" | "pending";
    level: "officer" | "dean";
    remarks?: string; // Required if decision is 'rejected'
    institutionId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ClearanceReviewSchema = new Schema<IClearanceReview>({
    submissionId: {
        type: Schema.Types.ObjectId,
        ref: "ClearanceSubmission",
        required: true
    },
    reviewerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    decision: {
        type: String,
        enum: ["approved", "rejected", "pending"],
        required: true
    },
    level: {
        type: String,
        enum: ["officer", "dean"],
        required: true
    },
    remarks: {
        type: String,
        trim: true,
        validate: {
            validator: function (this: any, v: string) {
                // Remarks are required specifically for rejections
                return this.decision === 'rejected' ? !!(v && v.length > 0) : true;
            },
            message: "Remarks are required for rejections."
        }
    },
    institutionId: {
        type: Schema.Types.ObjectId,
        ref: "Institution",
        required: true
    }
}, {
    timestamps: true
});

// A submission has exactly one review per approval level
ClearanceReviewSchema.index({ submissionId: 1, level: 1 }, { unique: true });

// Facilitate lookup for a reviewer's history
ClearanceReviewSchema.index({ reviewerId: 1, createdAt: -1 });

// Scoping for multi-tenancy
ClearanceReviewSchema.index({ institutionId: 1 });

export default mongoose.model<IClearanceReview>("ClearanceReview", ClearanceReviewSchema);
