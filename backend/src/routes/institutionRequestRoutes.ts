import { Router } from 'express';
import { InstitutionRequestController } from '../controllers/institutionRequestController';
import { auth, AuthRequest } from '../middleware/authMiddleware';
import { admin } from '../middleware/roleMiddleware';

const router = Router();

// Public routes (no authentication required)
router.post('/submit', InstitutionRequestController.submitRequest);
router.get('/verify/:token', InstitutionRequestController.verifyRequest);

// Admin routes (require Super Admin authentication)
router.use(auth);
router.use((req: AuthRequest, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Super Admins only" });
  }
  next();
});

router.get('/', InstitutionRequestController.getAllRequests);
router.get('/stats', InstitutionRequestController.getRequestStats);
router.get('/:id', InstitutionRequestController.getRequestById);
router.post('/:id/approve', InstitutionRequestController.approveRequest);
router.post('/:id/reject', InstitutionRequestController.rejectRequest);
router.post('/:id/clarify', InstitutionRequestController.requestClarification);

export default router;
