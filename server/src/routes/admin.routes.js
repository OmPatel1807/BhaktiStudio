import { Router } from 'express';
import { promoteUserToAdmin } from '../controllers/admin.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// Protect all admin endpoints with authentication and ADMIN role requirement
router.use(authenticateToken, authorizeRoles('ADMIN'));

router.post('/users/promote-to-admin', promoteUserToAdmin);

export default router;
