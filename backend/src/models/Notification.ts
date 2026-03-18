/**
 * Notification model for user notifications and alerts
 * Stores system messages for individual users with read status tracking
 */

import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId; // User who receives notification
  institutionId?: mongoose.Types.ObjectId; // Institution (for security)
  title: string; // Notification title
  message: string; // The notification message content
  type: "info" | "success" | "warning" | "error"; // Notification type
  category?: "clearance" | "submission" | "approval" | "system"; // Notification category
  relatedEntityId?: mongoose.Types.ObjectId; // Related submission/clearance item
  relatedEntityType?: "ClearanceSubmission" | "ClearanceItem"; // Type of related entity
  isRead: boolean; // Whether user has read this notification
  actionUrl?: string; // URL to navigate to when clicked
  createdBy?: mongoose.Types.ObjectId; // Who triggered this notification
  readAt?: Date; // When notification was read
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // User reference
  institutionId: { type: Schema.Types.ObjectId, ref: "Institution" }, // Institution reference
  title: { type: String, required: true }, // Notification title
  message: { type: String, required: true }, // Message content
  type: { type: String, enum: ["info", "success", "warning", "error"] }, // Notification type
  category: { type: String, enum: ["clearance", "submission", "approval", "system"] }, // Notification category
  relatedEntityId: { type: Schema.Types.ObjectId }, // Related submission/clearance item
  relatedEntityType: { type: String, enum: ["ClearanceSubmission", "ClearanceItem"] }, // Type of related entity
  isRead: { type: Boolean, default: false }, // Read status
  actionUrl: { type: String }, // URL to navigate to when clicked
  createdBy: { type: Schema.Types.ObjectId, ref: "User" }, // Who triggered this notification
  readAt: { type: Date } // When notification was read
}, { timestamps: true });

export default mongoose.model<INotification>("Notification", NotificationSchema);
