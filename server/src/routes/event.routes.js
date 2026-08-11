import { Router } from 'express';
import {
  uploadSitePhoto,
  updateExecutionStatus,
  getEventByQrToken,
} from '../controllers/event.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Public / Authenticated QR Token Resolution
router.get('/qr/:qrCodeToken', getEventByQrToken);

// Authenticated Worker / Admin Execution Operations
router.post('/:orderId/photos', authenticateToken, uploadSitePhoto);
router.patch('/:orderId/status', authenticateToken, updateExecutionStatus);

export default router;
