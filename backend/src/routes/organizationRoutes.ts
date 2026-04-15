import express from "express";
import {
    createOrganization,
    getInstitutionOrganizations,
    joinOrganization,
    leaveOrganization,
    removeMember,
    getOrganizationDetails,
    getTerms,
    getOrganizationMembers,
    archiveOrganization,
    restoreOrganization,
    getMyOrganizations,
    updateOrganizationAppearance
} from "../controllers/organizationController";
import { getOrganizationRequirements } from "../controllers/clearanceRequirementController";
import { auth } from "../middleware/authMiddleware";
import { admin, officer } from "../middleware/roleMiddleware";

const router = express.Router();

/**
 * Organization Management Routes
 * Prefix: /api/organizations
 */

// General actions
router.get("/my-organizations", auth, getMyOrganizations);
router.get("/:organizationId", auth, getOrganizationDetails);
router.get("/:organizationId/requirements", auth, getOrganizationRequirements);
router.get("/:organizationId/members", auth, getOrganizationMembers);
router.get("/terms/list", auth, getTerms);

// Student / Member actions
router.post("/join", auth, joinOrganization);
router.post("/:organizationId/leave", auth, leaveOrganization);

// Admin / Officer actions
// Admin / Officer actions
router.get("/", auth, admin, getInstitutionOrganizations);
router.post("/", auth, officer, createOrganization);
router.patch("/:organizationId/archive", auth, archiveOrganization);
router.put("/:organizationId/restore", auth, restoreOrganization);
router.post("/remove-member", auth, removeMember); // Officer check inside controller
router.put("/:organizationId/appearance", auth, updateOrganizationAppearance); // Officer / Admin check inside

export default router;
