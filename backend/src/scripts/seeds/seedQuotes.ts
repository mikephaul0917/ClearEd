/**
 * Database seeding script for inspirational quotes
 * Populates the database with default quotes for login/register pages
 * Run with: npm run seed-quotes
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Quote from "../../models/Quote";

dotenv.config();

const seedQuotes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string, { dbName: "e-clearance" });
    console.log("Connected to MongoDB");

    // Clear existing quotes to avoid duplicates
    await Quote.deleteMany({});
    console.log("Cleared existing quotes");

    // Default quotes for the application
    const quotes = [
      {
        text: "A great product doesn't just meet needs — it creates desire.",
        author: "Anonymous",
        page: "login" as const,
        isActive: true
      },
      {
        text: "The best products feel effortless to use.",
        author: "Julie Zhuo",
        page: "register" as const,
        isActive: true
      },
      {
        text: "Design is not just what it looks like and feels like. Design is how it works.",
        author: "Steve Jobs",
        page: "both" as const,
        isActive: true
      },
      {
        text: "Simplicity is the ultimate sophistication.",
        author: "Leonardo da Vinci",
        page: "both" as const,
        isActive: true
      },
      {
        text: "The details are not the details. They make the design.",
        author: "Charles Eames",
        page: "login" as const,
        isActive: true
      },
      {
        text: "Good design is obvious. Great design is transparent.",
        author: "Joe Sparano",
        page: "register" as const,
        isActive: true
      }
    ];

    // Insert quotes into database
    await Quote.insertMany(quotes);
    console.log(`Seeded ${quotes.length} quotes`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error seeding quotes:", error);
    process.exit(1);
  }
};

// Execute the seeding function
seedQuotes();
