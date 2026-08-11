import { Router } from 'express';
import {
  createPaymentIntent,
  verifyPayment,
  recordCashPayment,
  generateInvoice,
  initiateBankRedirect,
  renderMockBankPortal,
  handleBankCallback,
} from '../controllers/payment.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// Create Intent / Order & Cryptographic Verification
router.post('/create-intent', authenticateToken, createPaymentIntent);
router.post('/create-order', authenticateToken, createPaymentIntent);
router.post('/verify', authenticateToken, verifyPayment);
router.post('/verify-payment', authenticateToken, verifyPayment);

// Bank Redirection & Callback Endpoints
router.post('/initiate-bank-redirect', authenticateToken, initiateBankRedirect);
router.get('/mock-bank-portal', renderMockBankPortal);
router.post('/bank-callback', handleBankCallback);
router.get('/bank-callback', handleBankCallback);
router.post('/razorpay-callback', handleBankCallback);
router.get('/razorpay-callback', handleBankCallback);

// Admin Cash Override
router.post('/record-cash', authenticateToken, authorizeRoles('ADMIN'), recordCashPayment);

// Invoice Generation Endpoint
router.get('/:orderId/invoice', authenticateToken, generateInvoice);

export default router;
