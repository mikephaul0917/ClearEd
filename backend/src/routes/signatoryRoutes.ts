import express from "express";
import {
    listPending,
    reviewSubmission,
    getSignatoryRequirements,
    createSignatoryRequirement,
    updateSignatoryRequirement,
    deleteSignatoryRequirement
} from "../controllers/signatory/signatoryController";
import { auth } from "../middleware/authMiddleware";
import { officer } from "../middleware/roleMiddleware";
import { handleFileUpload } from "../middleware/uploadMiddlewareFixed";

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

export default router;
