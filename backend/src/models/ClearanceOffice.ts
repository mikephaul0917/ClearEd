import mongoose, { Schema, Document } from "mongoose";

/**
 * ClearanceOffice Entity
 * Represents an institutional office that participates in clearance workflows
 * (e.g., Library, Finance, Registrar). 
 * The sequence field determines the sign-off order.
 */
export interface IClearanceOffice extends Document {
    name: string;
    institutionId: mongoose.Types.ObjectId;
    sequence: number; // Order of approval (1, 2, 3...)
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ClearanceOfficeSchema = new Schema<IClearanceOffice>({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    institutionId: {
        type: Schema.Types.ObjectId,
        ref: "Institution",
        required: true
    },
    sequence: {
        type: Number,
        required: true,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Ensure sequence is unique per institution for deterministic flow
// Also index for multi-tenant lookups
ClearanceOfficeSchema.index({ institutionId: 1, sequence: 1 }, { unique: true });
ClearanceOfficeSchema.index({ institutionId: 1, isActive: 1 });

export default mongoose.model<IClearanceOffice>("ClearanceOffice", ClearanceOfficeSchema);
