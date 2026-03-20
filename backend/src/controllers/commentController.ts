import { Request, Response } from "express";
import Comment from "../models/Comment";
import ClearanceRequirement from "../models/ClearanceRequirement";

export const getComments = async (req: Request, res: Response) => {
  try {
    const { requirementId } = req.params;

    // Check if the requirement exists (it might be an announcement)
    const requirement = await ClearanceRequirement.findById(requirementId);
    if (!requirement) {
      return res.status(404).json({ message: "Post not found" });
    }

    const { isPrivate, studentId } = req.query;

    const query: any = { requirementId };

    if (isPrivate === 'true') {
      if (!studentId) {
        return res.status(400).json({ message: "studentId is required for private comments" });
      }
      query.isPrivate = true;
      query.studentId = studentId;
    } else {
      query.isPrivate = { $ne: true };
    }

    const comments = await Comment.find(query)
      .populate("userId", "firstName lastName fullName profilePicture")
      .sort({ createdAt: 1 });

    res.json(comments);

  } catch (error: any) {
    console.error('Get comments error:', error);
    res.status(500).json({
      message: "Failed to fetch comments",
      error: error.message
    });
  }
};

export const createComment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { requirementId } = req.params;
    const { content, isPrivate, studentId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const requirement = await ClearanceRequirement.findById(requirementId);
    if (!requirement) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (isPrivate && !studentId) {
      return res.status(400).json({ message: "studentId is required for private comments" });
    }

    const newComment = await Comment.create({
      requirementId,
      userId,
      isPrivate: isPrivate || false,
      studentId: isPrivate ? studentId : undefined,
      content: content.trim()
    });

    // Populate user info before returning
    await newComment.populate("userId", "firstName lastName fullName profilePicture");

    res.status(201).json({
      message: "Comment added successfully",
      comment: newComment
    });

  } catch (error: any) {
    console.error('Create comment error:', error);
    res.status(500).json({
      message: "Failed to add comment",
      error: error.message
    });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Only the author can delete their comment
    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    await Comment.findByIdAndDelete(id);

    res.json({ message: "Comment deleted successfully" });

  } catch (error: any) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      message: "Failed to delete comment",
      error: error.message
    });
  }
};
