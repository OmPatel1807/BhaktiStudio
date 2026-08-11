import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// Admin Only Security Audit Trail
router.get('/', authenticateToken, authorizeRoles('ADMIN'), getAuditLogs);

export default router;
