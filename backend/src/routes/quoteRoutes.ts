import express from "express";
import { getActiveQuotes } from "../controllers/admin/quoteController";

const router = express.Router();

// Public route to get active quotes for login/register pages
router.get("/quotes/:page", getActiveQuotes);

export default router;
