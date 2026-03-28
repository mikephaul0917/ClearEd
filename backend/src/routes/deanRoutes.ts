import express from "express";
import { getFinalReadySubmissions, listOrganizationPending, approveFinalClearance, revokeFinalApproval, getAssignedCourses } from "../controllers/dean/deanController";
import { auth } from "../middleware/authMiddleware";
import { dean } from "../middleware/roleMiddleware";

const router = express.Router();

router.get("/final-ready", auth, dean, getFinalReadySubmissions);
router.get("/organization-pending", auth, dean, listOrganizationPending);
router.post("/final-approval", auth, dean, approveFinalClearance);
router.post("/revoke-final-approval", auth, dean, revokeFinalApproval);
router.get("/courses", auth, dean, getAssignedCourses);

export default router;
