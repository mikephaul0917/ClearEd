import { Request, Response } from "express";
import Quote, { IQuote } from "../../models/Quote";
import crypto from "crypto";
import axios from "axios";

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

    // 1. Try API Ninjas (Primary if key exists)
    const NINJA_API_KEY = process.env.NINJA_API_KEY;
    if (NINJA_API_KEY) {
      try {
        // Fetching Quote of the Day (No categories to avoid premium restrictions)
        let response = await axios.get("https://api.api-ninjas.com/v2/quoteoftheday", {
          headers: { "X-Api-Key": NINJA_API_KEY },
          timeout: 5000 
        });

        const extractQuote = (data: any) => {
          if (Array.isArray(data) && data.length > 0) return data[0];
          if (data && data.quote) return data;
          return null;
        };

        let ninjaQuote = extractQuote(response.data);

        // Sub-fallback to standard quotes if quoteoftheday is empty
        if (!ninjaQuote) {
          const v1Response = await axios.get("https://api.api-ninjas.com/v1/quotes", {
            headers: { "X-Api-Key": NINJA_API_KEY },
            timeout: 5000
          });
          ninjaQuote = extractQuote(v1Response.data);
        }

        if (ninjaQuote) {
          return res.json({
            text: ninjaQuote.quote,
            author: ninjaQuote.author,
            isActive: true,
            page: "both",
            isExternal: true
          });
        }
      } catch (ninjaError: any) {
        console.error("API Ninjas fetch failed, falling back to database:", ninjaError.message);
      }
    }

    // 2. Try Local Database (Secondary Fallback)
    const quotes = await Quote.find({
      isActive: true,
      $or: [{ page }, { page: "both" }]
    }).sort({ createdAt: -1 });
    
    if (quotes.length > 0) {
      const randomIndex = Math.floor(crypto.randomBytes(4).readUInt32LE() / 0xFFFFFFFF * quotes.length);
      return res.json(quotes[randomIndex]);
    }

    // 3. Absolute Fallback (If both API and DB fail)
    res.status(404).json({ message: "No quotes available" });
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
