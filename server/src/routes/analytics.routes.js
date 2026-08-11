import { Router } from 'express';
import {
  getOverviewMetrics,
  getRevenueTrends,
  getOrdersBreakdown,
  getWorkloadMetrics,
} from '../controllers/analytics.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// All analytics routes require ADMIN authorization
router.get('/overview', authenticateToken, authorizeRoles('ADMIN'), getOverviewMetrics);
router.get('/revenue-chart', authenticateToken, authorizeRoles('ADMIN'), getRevenueTrends);
router.get('/orders-breakdown', authenticateToken, authorizeRoles('ADMIN'), getOrdersBreakdown);
router.get('/workload', authenticateToken, authorizeRoles('ADMIN'), getWorkloadMetrics);

export default router;
