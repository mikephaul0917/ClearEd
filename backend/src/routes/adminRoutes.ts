import express from "express";
import { listUsers, getUser, createUser, updateStatus, updateBulkStatus, updateRole, updateBulkRole, updateProfile, getInstitution, createRequirement, createTerm, activateTerm, deleteTerm, getClearanceStats, listRequirements, updateRequirement, deleteRequirement, getDeanAssignments, addDeanAssignment, removeDeanAssignment, getStudentProfile, updateStudentProfile } from "../controllers/admin/userManagementController";
import { listAccessRequests, getAccessRequestCount, approveAccessRequest, rejectAccessRequest } from "../controllers/admin/accessRequestController";
import {
    getInstitutionOrganizations,
    getDeletedOrganizations,
    createOrganization,
    updateOrganization,
    archiveOrganization,
    restoreOrganization,
    permanentDeleteOrganization,
    getTerms as getOrgTerms
} from "../controllers/organizationController";
import { listQuotes, getActiveQuotes, createQuote, updateQuote, deleteQuote, toggleQuoteStatus } from "../controllers/admin/quoteController";
import { getAuditLogs, exportAuditLogs } from "../controllers/admin/auditController";
import { auth } from "../middleware/authMiddleware";
import { admin } from "../middleware/roleMiddleware";

const router = express.Router();

router.get("/users", auth, admin, listUsers);
router.get("/users/:id", auth, admin, getUser);
router.post("/users", auth, admin, createUser);
router.put("/users/:id/role", auth, admin, updateRole);
router.put("/users/:id/status", auth, admin, updateStatus);
router.post("/users/bulk-status", auth, admin, updateBulkStatus);
router.post("/users/bulk-role", auth, admin, updateBulkRole);
router.put("/users/:id/profile", auth, admin, updateProfile);
// Student Profile routes (assigned courses/years)
router.get("/users/:id/student-profile", auth, admin, getStudentProfile);
router.put("/users/:id/student-profile", auth, admin, updateStudentProfile);

// Dean Assignment routes
router.get("/users/:id/dean-assignments", auth, admin, getDeanAssignments);
router.post("/users/:id/dean-assignments", auth, admin, addDeanAssignment);
router.delete("/users/:id/dean-assignments/:assignmentId", auth, admin, removeDeanAssignment);

router.get("/organizations", auth, admin, getInstitutionOrganizations);
router.get("/organizations/deleted", auth, admin, getDeletedOrganizations);
router.post("/organizations", auth, admin, createOrganization);
router.put("/organizations/:organizationId", auth, admin, updateOrganization);
router.patch("/organizations/:organizationId/archive", auth, admin, archiveOrganization);
router.put("/organizations/:organizationId/restore", auth, admin, restoreOrganization);
router.delete("/organizations/:organizationId/permanent", auth, admin, permanentDeleteOrganization);
router.post("/requirements", auth, admin, createRequirement);
router.get("/requirements", auth, admin, listRequirements);
router.put("/requirements/:id", auth, admin, updateRequirement);
router.delete("/requirements/:id", auth, admin, deleteRequirement);
router.post("/terms", auth, admin, createTerm);
router.get("/terms", auth, admin, getOrgTerms);
router.put("/terms/:id/activate", auth, admin, activateTerm);
router.delete("/terms/:id", auth, admin, deleteTerm);
router.get("/clearance-stats", auth, admin, getClearanceStats);
router.get("/institution", auth, admin, getInstitution);

// Access request management (Google Sign-in requests)
router.get("/access-requests", auth, admin, listAccessRequests);
router.get("/access-requests/count", auth, admin, getAccessRequestCount);
router.put("/access-requests/:id/approve", auth, admin, approveAccessRequest);
router.put("/access-requests/:id/reject", auth, admin, rejectAccessRequest);

// Legacy Department routes for backward compatibility/graceful transition
router.get("/departments", auth, admin, getInstitutionOrganizations);
router.get("/departments/deleted", auth, admin, getDeletedOrganizations);
router.post("/departments", auth, admin, createOrganization);
router.put("/departments/:organizationId", auth, admin, updateOrganization);
router.delete("/departments/:organizationId", auth, admin, archiveOrganization);
router.put("/departments/:organizationId/restore", auth, admin, restoreOrganization);
router.delete("/departments/:organizationId/permanent", auth, admin, permanentDeleteOrganization);

// Quote management routes
router.get("/quotes", auth, admin, listQuotes);
router.post("/quotes", auth, admin, createQuote);
router.put("/quotes/:id", auth, admin, updateQuote);
router.delete("/quotes/:id", auth, admin, deleteQuote);
router.put("/quotes/:id/toggle", auth, admin, toggleQuoteStatus);

// Audit log routes
router.get("/audit-logs", auth, admin, getAuditLogs);
router.get("/audit-logs/export", auth, admin, exportAuditLogs);

export default router;
