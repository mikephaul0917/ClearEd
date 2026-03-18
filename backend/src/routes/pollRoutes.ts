import express from "express";
import { auth } from "../middleware/authMiddleware";
import { handleFileUpload } from "../middleware/uploadMiddlewareFixed";
import { createPoll, getPollsByOrg, voteOnPoll, deletePoll } from "../controllers/signatory/pollController";

const router = express.Router();

// Fetch active polls for a given organization (must be a member)
router.get("/:organizationId", auth, getPollsByOrg);

// Create a new poll in the organization (must be an officer)
// Using handleFileUpload generically for up to 5 files like other clearance features
router.post("/", auth, handleFileUpload, createPoll);

// Vote on a poll
router.post("/:pollId/vote", auth, voteOnPoll);

// Delete a poll
router.delete("/:pollId", auth, deletePoll);

export default router;
