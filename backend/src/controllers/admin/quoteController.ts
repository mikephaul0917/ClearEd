import { Request, Response } from "express";
import Quote, { IQuote } from "../../models/Quote";
import crypto from "crypto";

// Get all quotes
export const listQuotes = async (req: Request, res: Response) => {
  try {
    const quotes = await Quote.find().sort({ createdAt: -1 });
    res.json(quotes);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch quotes", error: error.message });
  }
};

// Get active quotes for a specific page
export const getActiveQuotes = async (req: Request, res: Response) => {
  try {
    const { page } = req.params;
    const quotes = await Quote.find({
      isActive: true,
      $or: [{ page }, { page: "both" }]
    }).sort({ createdAt: -1 });
    
    // Return a random quote from the active ones using crypto for better randomness
    if (quotes.length > 0) {
      const randomIndex = Math.floor(crypto.randomBytes(4).readUInt32LE() / 0xFFFFFFFF * quotes.length);
      res.json(quotes[randomIndex]);
    } else {
      // Return default quote if no active quotes found
      res.json({
        text: "A great product doesn't just meet needs — it creates desire.",
        author: "Anonymous",
        isActive: true,
        page: "both"
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch quotes", error: error.message });
  }
};

// Create a new quote
export const createQuote = async (req: Request, res: Response) => {
  try {
    const { text, author, page = "both" } = req.body;
    
    if (!text || !author) {
      return res.status(400).json({ message: "Text and author are required" });
    }

    const quote = new Quote({
      text,
      author,
      page,
      isActive: true
    });

    await quote.save();
    res.status(201).json(quote);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to create quote", error: error.message });
  }
};

// Update a quote
export const updateQuote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text, author, page, isActive } = req.body;

    const quote = await Quote.findByIdAndUpdate(
      id,
      { text, author, page, isActive },
      { new: true, runValidators: true }
    );

    if (!quote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    res.json(quote);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update quote", error: error.message });
  }
};

// Delete a quote
export const deleteQuote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const quote = await Quote.findByIdAndDelete(id);
    
    if (!quote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    res.json({ message: "Quote deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to delete quote", error: error.message });
  }
};

// Toggle quote status (active/inactive)
export const toggleQuoteStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const quote = await Quote.findById(id);
    
    if (!quote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    quote.isActive = !quote.isActive;
    await quote.save();

    res.json(quote);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to toggle quote status", error: error.message });
  }
};
