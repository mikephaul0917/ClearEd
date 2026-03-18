import { Router } from 'express';
import { auth } from '../middleware/authMiddleware';
import { superAdmin } from '../middleware/superAdminMiddleware';
import {
  getSystemAnalytics,
  getInstitutionAnalytics,
  getSystemHealth
} from '../controllers/superAdminAnalyticsController';

const router = Router();

// Apply authentication and super admin middleware to all routes
router.use(auth);
router.use(superAdmin);

// System analytics endpoints
router.get('/system-analytics', getSystemAnalytics);
router.get('/system-health', getSystemHealth);
router.get('/institution-analytics/:institutionId', getInstitutionAnalytics);

export default router;
