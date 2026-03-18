import { Router } from 'express';
import { auth } from '../middleware/authMiddleware';
import { superAdmin } from '../middleware/superAdminMiddleware';
import {
  getAuditLogs,
  exportAuditLogs,
  getSecurityEvents,
  getAdminActions,
  getAuditStats
} from '../controllers/superAdminAuditController';

const router = Router();

// Apply authentication and super admin middleware to all routes
router.use(auth);
router.use(superAdmin);

// Audit logs endpoints
router.get('/audit-logs', getAuditLogs);
router.get('/audit-logs/export', exportAuditLogs);
router.get('/security-events', getSecurityEvents);
router.get('/admin-actions', getAdminActions);
router.get('/audit-stats', getAuditStats);

export default router;
