import express from "express";
import {
    listPending,
    reviewSubmission,
    getSignatoryRequirements,
    createSignatoryRequirement,
    updateSignatoryRequirement,
    deleteSignatoryRequirement,
    markAsOfficerCleared,
    bulkMarkAsOfficerCleared,
    revokeOfficerClearance,
    bulkRevokeOfficerClearance
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

// Mark multiple students as cleared for an organization by the officer
router.post("/organizations/:organizationId/bulk-clear-students", auth, officer, bulkMarkAsOfficerCleared);

// Get clearance overview for officers (Marks Tab data)
router.get("/organizations/:organizationId/clearance-overview", auth, officer, getOrganizationClearanceOverview);

// Revoke clearance for a specific student
router.post("/organizations/:organizationId/revoke-clearance/:studentId", auth, officer, revokeOfficerClearance);

// Revoke clearance for multiple students in bulk
router.post("/organizations/:organizationId/bulk-revoke-clearance", auth, officer, bulkRevokeOfficerClearance);

export default router;
