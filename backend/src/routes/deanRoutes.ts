import express from "express";
import { approveFinalClearance, listDeanPending } from "../controllers/dean/deanController";
import { auth } from "../middleware/authMiddleware";
import { dean } from "../middleware/roleMiddleware";

const router = express.Router();

// Get submissions ready for dean review (jurisdiction filtered)
router.get("/pending", auth, dean, listDeanPending);

// Grant final clearance approval for a student's request
router.post("/approve/:requestId", auth, dean, approveFinalClearance);

export default router;
