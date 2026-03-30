import express from 'express';
import { getPublicStats } from '../controllers/publicController';

const router = express.Router();

/**
 * @route GET /api/public/stats
 * @desc Get public metrics for the landing page
 * @access Public
 */
router.get('/stats', getPublicStats);

export default router;
