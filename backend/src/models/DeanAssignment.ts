import mongoose, { Schema, Document } from "mongoose";

/**
 * DeanAssignment Entity
 * Restricts which courses and year levels a Dean can approve.
 * This is used for filtering students in approval tables and enforcing 
 * departmental or course-based security for Dean-level reviews.
 */
export interface IDeanAssignment extends Document {
    deanId: mongoose.Types.ObjectId;
    course: string; // The specific course code or name (e.g., "BSCS")
    yearLevel: string; // The specific year (e.g., "1", "2", "3", "4", or "All")
    institutionId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const DeanAssignmentSchema = new Schema<IDeanAssignment>({
    deanId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    course: {
        type: String,
        required: true,
        trim: true
    },
    yearLevel: {
        type: String,
        enum: ["1", "2", "3", "4", "5", "All"],
        default: "All"
    },
    institutionId: {
        type: Schema.Types.ObjectId,
        ref: "Institution",
        required: true
    }
}, {
    timestamps: true
});

// A Dean can have multiple assignments (one per course/yearLevel)
// Index for uniqueness and multi-tenant lookup
DeanAssignmentSchema.index({ institutionId: 1, deanId: 1, course: 1, yearLevel: 1 }, { unique: true });

// Facilitate quick lookup for all assignments belonging to a Dean
DeanAssignmentSchema.index({ deanId: 1 });

export default mongoose.model<IDeanAssignment>("DeanAssignment", DeanAssignmentSchema);
