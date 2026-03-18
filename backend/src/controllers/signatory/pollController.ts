import { Request, Response } from "express";
import { Poll, PollVote } from "../../models/Poll";
import OrganizationMember from "../../models/OrganizationMember";
import mongoose from "mongoose";

export const createPoll = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user._id;
        const { organizationId, institutionId, question, instructions, options, allowedVotesPerUser, topic, expiresAt } = req.body;
        
        let assignedTo = req.body.assignedTo;
        if (assignedTo && typeof assignedTo === 'string') {
            try { assignedTo = JSON.parse(assignedTo); } catch(e) {}
        }
        
        let urlAttachments: any[] = [];
        if (req.body.attachments) {
            try { urlAttachments = JSON.parse(req.body.attachments); } catch(e) {}
        }

        let fileAttachments: any[] = [];
        if (req.files && Array.isArray(req.files)) {
            fileAttachments = req.files.map((file: any) => ({
                name: file.originalname,
                url: `/uploads/${file.filename}`,
                type: file.mimetype
            }));
        }

        // Verify user is an officer of this organization
        const membership = await OrganizationMember.findOne({
            userId,
            organizationId,
            role: "officer",
            status: "active"
        });

        if (!membership) {
            return res.status(403).json({ message: "You don't have permission to create polls for this organization." });
        }

        const poll = await Poll.create({
            question,
            instructions,
            options: typeof options === 'string' ? JSON.parse(options) : options,
            allowedVotesPerUser: allowedVotesPerUser ? Number(allowedVotesPerUser) : 1,
            organizationId,
            institutionId,
            createdBy: userId,
            assignedTo: Array.isArray(assignedTo) ? assignedTo : [],
            topic,
            expiresAt,
            attachments: [...urlAttachments, ...fileAttachments]
        });

        res.status(201).json({ message: "Poll created successfully", poll });
    } catch (error: any) {
        console.error("Error creating poll:", error);
        res.status(500).json({ message: "Failed to create poll", error: error.message });
    }
};

export const getPollsByOrg = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;
        const userId = (req as any).user._id;

        const membership = await OrganizationMember.findOne({
            userId,
            organizationId,
            status: "active"
        });

        if (!membership) {
            return res.status(403).json({ message: "You are not an active member of this organization." });
        }

        // Find active polls, including those universally assigned or exclusively assigned to this user
        const polls = await Poll.find({
            organizationId,
            isActive: true,
            $or: [
                { assignedTo: { $size: 0 } }, // Assigned to all
                { assignedTo: { $exists: false } },
                { assignedTo: userId }
            ]
        }).sort({ createdAt: -1 })
        .populate("createdBy", "firstName lastName email")
        .populate("organizationId", "name code");

        // Attach vote counts to each poll to see the results
        const pollIds = polls.map((p: any) => p._id);
        const allVotes = await PollVote.find({ pollId: { $in: pollIds } });

        const pollsWithVotes = polls.map((poll: any) => {
            const pollVotes = allVotes.filter(v => v.pollId.toString() === poll._id.toString());
            const hasVoted = pollVotes.some(v => v.userId.toString() === userId.toString());
            const userVote = pollVotes.find(v => v.userId.toString() === userId.toString());

            // Tally up the total votes per option
            const results = poll.options.reduce((acc: Record<string, number>, option: string) => {
                acc[option] = pollVotes.filter(v => v.selectedOptions.includes(option)).length;
                return acc;
            }, {} as Record<string, number>);

            return {
                ...poll.toObject(),
                results,
                totalVotes: pollVotes.length,
                hasVoted,
                userVote: userVote ? userVote.selectedOptions : null
            };
        });

        res.status(200).json({ polls: pollsWithVotes });
    } catch (error: any) {
        console.error("Error fetching polls:", error);
        res.status(500).json({ message: "Failed to fetch polls", error: error.message });
    }
};

export const voteOnPoll = async (req: Request, res: Response): Promise<any> => {
    try {
        const { pollId } = req.params;
        const { selectedOptions } = req.body;
        const userId = (req as any).user._id;

        const poll = await Poll.findById(pollId);
        if (!poll || !poll.isActive) {
            return res.status(404).json({ message: "Poll not found or inactive." });
        }

        if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) {
            return res.status(400).json({ message: "This poll has expired." });
        }

        if (!Array.isArray(selectedOptions) || selectedOptions.length === 0) {
            return res.status(400).json({ message: "You must select at least one option." });
        }

        if (selectedOptions.length > poll.allowedVotesPerUser) {
            return res.status(400).json({ message: `You can only select up to ${poll.allowedVotesPerUser} options.` });
        }

        // Validate that options actually exist
        const invalidOptions = selectedOptions.filter(opt => !poll.options.includes(opt));
        if (invalidOptions.length > 0) {
            return res.status(400).json({ message: "Invalid poll option selected." });
        }

        // Basic upsert so if a user tries voting again, it just updates their existing singular response
        const vote = await PollVote.findOneAndUpdate(
            { pollId, userId },
            { selectedOptions },
            { upsert: true, new: true, runValidators: true }
        );

        res.status(200).json({ message: "Vote recorded successfully.", vote });
    } catch (error: any) {
        console.error("Error voting on poll:", error);
        res.status(500).json({ message: "Failed to record vote", error: error.message });
    }
};

export const deletePoll = async (req: Request, res: Response): Promise<any> => {
    try {
        const { pollId } = req.params;
        const userId = (req as any).user._id;

        const poll = await Poll.findById(pollId);
        if (!poll) {
            return res.status(404).json({ message: "Poll not found." });
        }
        
        // Ensure user is the creator or an active officer of the relevant org
        const membership = await OrganizationMember.findOne({
            userId,
            organizationId: poll.organizationId,
            role: "officer",
            status: "active"
        });

        if (!membership && poll.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You don't have permission to delete this poll." });
        }

        await Poll.findByIdAndDelete(pollId);
        await PollVote.deleteMany({ pollId });

        res.status(200).json({ message: "Poll successfully deleted." });
    } catch(error: any) {
        console.error("Error deleting poll:", error);
        res.status(500).json({ message: "Failed to delete poll", error: error.message });
    }
};
