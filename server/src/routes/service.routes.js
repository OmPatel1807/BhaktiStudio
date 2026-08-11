import { Router } from 'express';
import {
  getAllServices,
  createService,
  updateService,
  deleteService,
} from '../controllers/service.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// GET /api/v1/services - Public / Customer (optional auth for admin full view)
router.get('/', (req, res, next) => {
  // Pass to authenticateToken if header exists, but don't fail if missing
  if (req.headers.authorization) {
    return authenticateToken(req, res, next);
  }
  next();
}, getAllServices);

// ADMIN Mutations
router.post('/', authenticateToken, authorizeRoles('ADMIN'), createService);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), updateService);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteService);

export default router;
