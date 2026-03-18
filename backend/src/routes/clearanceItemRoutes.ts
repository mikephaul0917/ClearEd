import { Router } from "express";
import { auth } from "../middleware/authMiddleware";
import {
  getClearanceRequirements,
  submitRequirement,
  getOfficerSubmissions,
  downloadFile,
  getRequirementSubmissions
} from "../controllers/clearanceItemController";
import { handleFileUpload } from "../middleware/uploadMiddlewareFixed";

const router = Router();

// Student routes
router.get("/requirements", auth, getClearanceRequirements);
router.post("/submit", auth, handleFileUpload, submitRequirement);
router.get("/download/:filename", auth, downloadFile);

// Officer routes
router.get("/officer/submissions", auth, getOfficerSubmissions);
router.get("/officer/requirement/:requirementId", auth, getRequirementSubmissions);

export default router;
