/**
 * Quote model for displaying inspirational messages on login/register pages
 * Supports different quotes for different pages with active/inactive status
 */

import mongoose, { Schema, Document } from "mongoose";

export interface IQuote extends Document {
  text: string; // The inspirational quote text
  author: string; // Quote author attribution
  isActive: boolean; // Whether this quote should be displayed
  page: "login" | "register" | "both"; // Which page(s) this quote appears on
}

const QuoteSchema = new Schema<IQuote>({
  text: { type: String, required: true }, // Quote content
  author: { type: String, required: true }, // Author name
  isActive: { type: Boolean, default: true }, // Display status
  page: { type: String, enum: ["login", "register", "both"], default: "both" } // Page targeting
}, { timestamps: true });

export default mongoose.model<IQuote>("Quote", QuoteSchema);
