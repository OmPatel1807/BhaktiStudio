import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import authRoutes from './auth.routes.js';
import serviceRoutes from './service.routes.js';
import equipmentRoutes from './equipment.routes.js';
import settingsRoutes from './settings.routes.js';
import orderRoutes from './order.routes.js';
import quotationRoutes from './quotation.routes.js';
import workerRoutes from './worker.routes.js';
import assignmentRoutes from './assignment.routes.js';
import eventRoutes from './event.routes.js';
import paymentRoutes from './payment.routes.js';
import notificationRoutes from './notification.routes.js';
import analyticsRoutes from './analytics.routes.js';
import auditRoutes from './audit.routes.js';

import {
  globalRateLimiter,
  authRateLimiter,
  sanitizeInputs,
  applySecurityHeaders,
} from '../middleware/security.middleware.js';
import { PricingEngineService } from '../services/pricingEngine.js';

const router = Router();
const prisma = new PrismaClient();

// Apply Security Middleware Stack
router.use(applySecurityHeaders);
router.use(sanitizeInputs);
router.use(globalRateLimiter);

// Enhanced Production Health Check Endpoint
router.get('/health', async (req, res) => {
  let dbStatus = 'HEALTHY';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = 'UNHEALTHY';
  }

  res.json({
    status: dbStatus === 'HEALTHY' ? 'online' : 'degraded',
    system: 'Bhakti Studio Production API',
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    database: {
      status: dbStatus,
      provider: 'PostgreSQL',
    },
    timestamp: new Date().toISOString(),
  });
});

// Domain Routes
router.use('/auth', authRateLimiter, authRoutes);
router.use('/services', serviceRoutes);
router.use('/catalog', serviceRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/settings', settingsRoutes);
router.use('/orders', orderRoutes);
router.use('/quotations', quotationRoutes);
router.use('/workers', workerRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/events', eventRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/audit-logs', auditRoutes);

// Legacy Pricing Engine Estimation Endpoint
router.post('/pricing/calculate-estimate', (req, res) => {
  try {
    const { widthFeet, heightFeet, technicianHours, transportDistanceKm, customItems, adminDiscount } = req.body;
    const calculation = PricingEngineService.calculateQuotation({
      widthFeet,
      heightFeet,
      technicianHours,
      transportDistanceKm,
      customItems,
      adminDiscount
    });
    res.json({ success: true, data: calculation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
