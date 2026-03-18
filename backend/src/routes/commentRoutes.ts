import { Router } from "express";
import { auth } from "../middleware/authMiddleware";
import { getComments, createComment, deleteComment } from "../controllers/commentController";

const router = Router();

router.get("/:requirementId", auth, getComments);
router.post("/:requirementId", auth, createComment);
router.delete("/:id", auth, deleteComment);

export default router;
