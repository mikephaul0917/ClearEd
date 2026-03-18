import mongoose, { Schema, Document } from "mongoose";

/**
 * Poll Entity
 * Allows officers to create multi-choice questions for members in the stream.
 */
export interface IPoll extends Document {
    question: string;
    instructions?: string;
    options: string[];
    allowedVotesPerUser: number;
    topic?: string;
    attachments: {
        name: string;
        url: string;
        type: string;
    }[];
    assignedTo?: mongoose.Types.ObjectId[]; // Specific members assigned. If empty/undefined, means all members
    organizationId: mongoose.Types.ObjectId;
    institutionId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    isActive: boolean;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PollSchema = new Schema<IPoll>({
    question: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300
    },
    instructions: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    options: {
        type: [String],
        required: true,
        validate: [(v: string[]) => v.length >= 2, 'A poll must have at least two options']
    },
    allowedVotesPerUser: {
        type: Number,
        default: 1,
        min: 1
    },
    topic: {
        type: String,
        trim: true,
        maxlength: 100
    },
    attachments: [{
        name: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String }
    }],
    assignedTo: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
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
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for performance
PollSchema.index({ organizationId: 1, isActive: 1 });
PollSchema.index({ createdBy: 1 });

export const Poll = mongoose.model<IPoll>("Poll", PollSchema);

/**
 * PollVote Entity
 * Tracks student responses to polls.
 */
export interface IPollVote extends Document {
    pollId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    selectedOptions: string[];
    createdAt: Date;
    updatedAt: Date;
}

const PollVoteSchema = new Schema<IPollVote>({
    pollId: {
        type: Schema.Types.ObjectId,
        ref: "Poll",
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    selectedOptions: {
        type: [String],
        required: true,
        validate: [(v: string[]) => v.length > 0, 'Must select at least one option']
    }
}, {
    timestamps: true
});

// Ensure a user can only vote once per poll (even if selecting multiple options simultaneously)
PollVoteSchema.index({ pollId: 1, userId: 1 }, { unique: true });

export const PollVote = mongoose.model<IPollVote>("PollVote", PollVoteSchema);
