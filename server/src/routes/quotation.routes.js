import { Router } from 'express';
import {
  createQuotationVersion,
  getQuotationHistory,
  respondToQuotation,
} from '../controllers/quotation.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// Admin Route: Create & Issue Quotation V[N]
router.post('/:orderId', authenticateToken, authorizeRoles('ADMIN'), createQuotationVersion);

// History Route: View version history
router.get('/:orderId/history', authenticateToken, getQuotationHistory);

// Customer Route: Accept / Reject Quotation
router.post('/orders/:orderId/quotation-response', authenticateToken, respondToQuotation);

export default router;
