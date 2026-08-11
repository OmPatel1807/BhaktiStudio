import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// Settings read and mutation require ADMIN role
router.use(authenticateToken, authorizeRoles('ADMIN'));

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;
