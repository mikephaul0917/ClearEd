import express from "express";
import {
    listPending,
    reviewSubmission,
    getSignatoryRequirements,
    createSignatoryRequirement,
    updateSignatoryRequirement,
    deleteSignatoryRequirement,
    markAsOfficerCleared
} from "../controllers/signatory/signatoryController";
import { auth } from "../middleware/authMiddleware";
import { officer } from "../middleware/roleMiddleware";
import { handleFileUpload } from "../middleware/uploadMiddlewareFixed";
import { getOrganizationClearanceOverview } from "../controllers/clearanceWorkflowController";

const router = express.Router();

// List pending submissions for organizations where the user is an officer
router.get("/pending", auth, officer, listPending);

// Review (approve/reject) a specific clearance submission
router.post("/review/:submissionId", auth, officer, reviewSubmission);

// Requirement Management for Officers
router.get("/requirements", auth, officer, getSignatoryRequirements);
router.post("/requirements", auth, officer, handleFileUpload, createSignatoryRequirement);
router.put("/requirements/:id", auth, officer, handleFileUpload, updateSignatoryRequirement);
router.delete("/requirements/:id", auth, officer, deleteSignatoryRequirement);

// Mark a student as cleared for an organization by the officer
router.post("/organizations/:organizationId/clear-student/:studentId", auth, officer, markAsOfficerCleared);

// Get clearance overview for officers (Marks Tab data)
router.get("/organizations/:organizationId/clearance-overview", auth, officer, getOrganizationClearanceOverview);

export default router;
