import express from 'express';
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getActiveAnnouncements,
  acknowledgeAnnouncement,
  getAnnouncementStats
} from '../controllers/announcementController';
import { auth } from '../middleware/authMiddleware';
import { superAdminOnly } from '../middleware/superAdmin';
import { handleFileUpload } from '../middleware/uploadMiddlewareFixed';

const router = express.Router();

// Public routes - no authentication required
// Get active announcements for public access
router.get('/public/active', getActiveAnnouncements);

// Super Admin routes for announcement management
router.use(auth); // All subsequent routes require authentication

// Get all announcements (Super Admin only)
router.get('/', superAdminOnly, getAnnouncements);

// Get announcement statistics (Super Admin only)
router.get('/stats', superAdminOnly, getAnnouncementStats);

// Get single announcement (Super Admin only)
router.get('/:id', superAdminOnly, getAnnouncementById);

// Create announcement (Super Admin only) - with file upload support
router.post('/', superAdminOnly, handleFileUpload, createAnnouncement);

// Update announcement (Super Admin only) - with file upload support
router.put('/:id', superAdminOnly, handleFileUpload, updateAnnouncement);

// Delete announcement (Super Admin only)
router.delete('/:id', superAdminOnly, deleteAnnouncement);

// Acknowledge announcement (requires authentication)
router.post('/:id/acknowledge', auth, acknowledgeAnnouncement);

export default router;
