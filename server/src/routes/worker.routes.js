import { Router } from 'express';
import {
  getAllWorkers,
  createWorker,
  updateWorker,
  getWorkerAvailability,
  setWorkerAvailability,
  checkWorkerConflicts,
  applyWorker,
  getPendingWorkers,
  approveWorker,
  rejectWorker,
  uploadExecutionMedia,
  getWorkerMyOrders,
  getWorkerEarnings,
} from '../controllers/worker.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// PUBLIC Route: Self-Registration Application
router.post('/apply', applyWorker);

// Worker Operations Proof of Execution Upload
router.get('/my-orders', authenticateToken, getWorkerMyOrders);
router.get('/earnings', authenticateToken, getWorkerEarnings);
router.post('/orders/:orderId/upload-media', authenticateToken, uploadExecutionMedia);

// Admin Routes for Pending Approvals Queue
router.get('/pending', authenticateToken, authorizeRoles('ADMIN'), getPendingWorkers);
router.patch('/:id/approve', authenticateToken, authorizeRoles('ADMIN'), approveWorker);
router.patch('/:id/reject', authenticateToken, authorizeRoles('ADMIN'), rejectWorker);

// Admin Routes for Worker Profile Management
router.get('/', authenticateToken, authorizeRoles('ADMIN'), getAllWorkers);
router.post('/', authenticateToken, authorizeRoles('ADMIN'), createWorker);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), updateWorker);

// Availability & Conflict Checks
router.get('/:workerId/availability', authenticateToken, getWorkerAvailability);
router.post('/availability/set-status', authenticateToken, setWorkerAvailability);
router.post('/availability/check-conflicts', authenticateToken, checkWorkerConflicts);

export default router;
