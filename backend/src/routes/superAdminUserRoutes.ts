import { Router } from 'express';
import { auth } from '../middleware/authMiddleware';
import { superAdmin } from '../middleware/superAdminMiddleware';
import {
  getUsers,
  getInstitutions,
  getUserStats,
  getUserDetails,
  disableUser,
  getInvitationHistory,
  getUserActivity
} from '../controllers/superAdminUserController';

const router = Router();

// Apply authentication and super admin middleware to all routes
router.use(auth);
router.use(superAdmin);

// User monitoring endpoints
router.get('/users', getUsers);
router.get('/institutions', getInstitutions);
router.get('/user-stats', getUserStats);
router.get('/users/:userId', getUserDetails);
router.post('/users/:userId/disable', disableUser);
router.get('/invitation-history', getInvitationHistory);
router.get('/users/:userId/activity', getUserActivity);

export default router;
