import express from "express";
import { Request, Response } from "express";
import { 
  unifiedLogin, 
  createUserByAdmin, 
  getInstitutionByDomain,
  googleAuth,
  superAdminLogin 
} from "../controllers/unifiedAuthController";
import { authenticate, institutionAdminOnly } from "../middleware/enhancedAuthMiddleware";

const router = express.Router();

// Primary unified login endpoint (Google Classroom-style)
router.post("/login", unifiedLogin);

// Institution validation endpoint (for frontend domain checking)
router.get("/institution", getInstitutionByDomain);

// Google OAuth authentication endpoint
router.post("/google-auth", googleAuth);

// Super Admin login endpoint
router.post("/super-admin/login", superAdminLogin);

// Protected routes (for admin user creation)
router.post("/create-user", authenticate, institutionAdminOnly, createUserByAdmin);

export default router;
