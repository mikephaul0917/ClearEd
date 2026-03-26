import express from "express";
import { Request, Response } from "express";
import { 
  unifiedLogin, 
  createUserByAdmin, 
  getInstitutionByDomain,
  googleAuth,
  superAdminLogin,
  getMyProfile,
  updateMyProfile,
  updateMyPassword
} from "../controllers/unifiedAuthController";
import { authenticate, institutionAdminOnly } from "../middleware/enhancedAuthMiddleware";
import { auth } from "../middleware/authMiddleware";

const router = express.Router();

// Primary unified login endpoint (Google Classroom-style)
router.post("/login", unifiedLogin);

// Institution validation endpoint (for frontend domain checking)
router.get("/institution", getInstitutionByDomain);

// Google OAuth authentication endpoint
router.post("/google-auth", googleAuth);

// Super Admin login endpoint
router.post("/super-admin/login", superAdminLogin);

// User Profile and Password Settings (Used by Officer/Dean settings)
router.get("/profile", auth, getMyProfile);
router.put("/profile", auth, updateMyProfile);
router.put("/password", auth, updateMyPassword);

// Protected routes (for admin user creation)
router.post("/create-user", authenticate, institutionAdminOnly, createUserByAdmin);

export default router;
