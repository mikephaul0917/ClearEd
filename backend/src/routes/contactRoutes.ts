import express from "express";
import { ContactController } from "../controllers/contactController";

const router = express.Router();

/**
 * @route   POST /api/contact/submit
 * @desc    Submit a contact form
 * @access  Public
 */
router.post("/submit", ContactController.submitContactForm);

export default router;
