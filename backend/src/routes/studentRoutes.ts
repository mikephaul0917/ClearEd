import express from "express";
import { getDashboard, getProfile, updateProfile } from "../controllers/student/studentController";
import { getStudentTodoList } from "../controllers/clearanceSubmissionController";
import { auth } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/dashboard", auth, getDashboard);
router.get("/todo", auth, getStudentTodoList);
router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);

export default router;
