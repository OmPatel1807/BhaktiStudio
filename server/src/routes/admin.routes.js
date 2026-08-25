import { Router } from 'express';
import { promoteUserToAdmin, updateOrderQuotation, createWorkerPayout, getWorkerPayoutsSummary } from '../controllers/admin.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// Protect all admin endpoints with authentication and ADMIN role requirement
router.use(authenticateToken, authorizeRoles('ADMIN'));

router.post('/users/promote-to-admin', promoteUserToAdmin);
router.post('/orders/:orderId/quotation', updateOrderQuotation);

// Worker Payroll Settlements
router.get('/workers/payouts-summary', getWorkerPayoutsSummary);
router.post('/workers/:workerId/payout', createWorkerPayout);

export default router;
