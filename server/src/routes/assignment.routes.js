import { Router } from 'express';
import {
  createAssignments,
  respondToAssignment,
  getWorkerAssignedJobs,
} from '../controllers/assignment.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// Admin Route: Dispatch Worker Assignments
router.post('/', authenticateToken, authorizeRoles('ADMIN'), createAssignments);

// Worker Routes: My Jobs & Respond
router.get('/my-jobs', authenticateToken, getWorkerAssignedJobs);
router.post('/:id/respond', authenticateToken, respondToAssignment);

export default router;
