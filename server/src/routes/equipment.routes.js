import { Router } from 'express';
import {
  getAllEquipment,
  createEquipmentUnit,
  updateEquipmentStatus,
} from '../controllers/equipment.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// All Equipment endpoints require ADMIN role
router.use(authenticateToken, authorizeRoles('ADMIN'));

router.get('/', getAllEquipment);
router.post('/', createEquipmentUnit);
router.patch('/:id/status', updateEquipmentStatus);

export default router;
