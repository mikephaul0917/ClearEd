/**
 * Super Admin routes for institution access request management
 * All routes require super_admin role authentication
 */

import express from 'express';
import { authenticate, superAdminOnly } from '../middleware/enhancedAuthMiddleware';
import {
  getPendingRequests,
  approveRequest,
  rejectRequest,
  getAllRequests
} from '../controllers/superAdminController';

const router = express.Router();

// Apply authentication and role check to all routes
router.use(authenticate);
router.use(superAdminOnly);

/**
 * GET /api/super-admin/institution-requests/pending
 * Get all pending institution requests for approval
 */
router.get('/institution-requests/pending', getPendingRequests);

/**
 * POST /api/super-admin/institution-requests/:requestId/approve
 * Approve an institution request
 * Body: { notes?: string }
 */
router.post('/institution-requests/:requestId/approve', approveRequest);

/**
 * POST /api/super-admin/institution-requests/:requestId/reject
 * Reject an institution request
 * Body: { rejectionReason: string }
 */
router.post('/institution-requests/:requestId/reject', rejectRequest);

/**
 * GET /api/super-admin/institution-requests
 * Get all institution requests with filtering
 * Query: { status?: string, page?: number, limit?: number }
 */
router.get('/institution-requests', getAllRequests);

export default router;
