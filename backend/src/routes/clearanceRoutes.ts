import express from "express";
import { startClearance, getTimeline, getCertificate, getMyClearances, submitToDean } from "../controllers/clearanceController";
import { auth } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * Student Clearance Routes
 */

// Start a new clearance workflow for an organization
router.post("/start", auth, startClearance);

// Get student's clearance status across all organizations
router.get("/my-clearances", auth, getMyClearances);

// Submit all completed clearances to the Dean
router.post("/submit-to-dean", auth, submitToDean);

// Get student's clearance timeline/progress for a specific organization
router.get("/timeline/:organizationId", auth, getTimeline);

// Get placeholder certificate
router.get("/certificate", auth, getCertificate);

export default router;
