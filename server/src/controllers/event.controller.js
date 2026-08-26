import { PrismaClient } from '@prisma/client';
import { StorageService } from '../services/storageService.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const prisma = new PrismaClient();

/**
 * POST /api/v1/events/:orderId/photos
 * WORKER / ADMIN: Upload site photo (BEFORE_SETUP or AFTER_SETUP)
 */
export const uploadSitePhoto = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;
    const { photoType, photoData, fileName = 'site_photo.jpg' } = req.body;

    if (!photoType || !['BEFORE_SETUP', 'AFTER_SETUP', 'COMPLETED'].includes(photoType)) {
      return res.status(400).json({
        success: false,
        message: 'Valid photoType (BEFORE_SETUP, AFTER_SETUP, COMPLETED) is required.',
      });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const photoUrl = StorageService.savePhoto(photoData, fileName);

    const eventPhoto = await prisma.eventPhoto.create({
      data: {
        orderId,
        photoType,
        photoUrl,
        uploadedBy: userId,
      },
      include: {
        uploader: { select: { name: true, role: true } },
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        orderId,
        actorId: userId,
        action: `SITE_PHOTO_UPLOADED_${photoType}`,
        details: JSON.stringify({ photoId: eventPhoto.id, photoUrl }),
      },
    });

    return res.status(201).json({
      success: true,
      message: `${photoType} photo uploaded successfully.`,
      data: eventPhoto,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/v1/events/:orderId/status
 * WORKER / ADMIN: Update execution milestone status
 */
export const updateExecutionStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;
    const { nextStatus } = req.body;

    const allowedStatuses = ['SETUP_IN_PROGRESS', 'EVENT_IN_PROGRESS', 'EVENT_COMPLETED'];
    if (!allowedStatuses.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid execution status transition to ${nextStatus}. Allowed: ${allowedStatuses.join(', ')}`,
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { photos: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Business Rule Check: Transitioning to EVENT_IN_PROGRESS requires at least 1 AFTER_SETUP photo
    if (nextStatus === 'EVENT_IN_PROGRESS') {
      const hasAfterSetupPhoto = order.photos.some((p) => p.photoType === 'AFTER_SETUP');
      if (!hasAfterSetupPhoto) {
        return res.status(400).json({
          success: false,
          message: 'Execution rule violation: At least one AFTER_SETUP photo must be uploaded before starting event.',
        });
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: nextStatus },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        orderId,
        actorId: userId,
        action: `EXECUTION_MILESTONE_${nextStatus}`,
        details: JSON.stringify({ previousStatus: order.status, newStatus: nextStatus }),
      },
    });

    return res.json({
      success: true,
      message: `Event status updated to ${nextStatus}.`,
      data: updatedOrder,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/events/qr/:qrCodeToken
 * Resolve secure QR Token and return event workspace details
 */
export const getEventByQrToken = async (req, res) => {
  try {
    const { qrCodeToken } = req.params;

    const order = await prisma.order.findUnique({
      where: { qrCodeToken },
      include: {
        customer: { select: { name: true, phone: true, email: true } },
        orderItems: true,
        photos: {
          include: { uploader: { select: { name: true } } },
          orderBy: { uploadedAt: 'desc' },
        },
        assignments: {
          include: {
            workerProfile: {
              include: { user: { select: { name: true, phone: true, avatarUrl: true } } },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Invalid or expired QR Code token.' });
    }

    // Log QR check-in event scan
    if (req.user) {
      await logAuditEvent({
        userId: req.user.userId,
        orderId: order.id,
        action: 'QR_CODE_SCANNED',
        category: 'CREW_OPERATIONS',
        details: { orderNumber: order.orderNumber, qrCodeToken },
      });
    }

    return res.json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
