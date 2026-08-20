import { Router } from 'express';
import { calculateEstimate, createOrder, getMyOrders, getAllOrders, getOrderById, assignWorkersToOrder, updateOrderStatus, updateOrder } from '../controllers/order.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

// POST /api/v1/orders/estimate (Public / Customer live estimator)
router.post('/estimate', calculateEstimate);

// Authenticated Endpoints
router.post('/', authenticateToken, createOrder);
router.put('/:id', authenticateToken, updateOrder);
router.get('/my-orders', authenticateToken, getMyOrders);

// Admin Only Order Management Endpoints
router.get('/all', authenticateToken, authorizeRoles('ADMIN'), getAllOrders);
router.get('/:id', authenticateToken, getOrderById);
router.patch('/:orderId/status', authenticateToken, authorizeRoles('ADMIN'), updateOrderStatus);
router.post('/:orderId/assign-workers', authenticateToken, authorizeRoles('ADMIN'), assignWorkersToOrder);

export default router;
