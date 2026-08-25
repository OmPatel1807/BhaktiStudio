import { PrismaClient } from '@prisma/client';
import { WorkerAssignmentService } from '../services/workerAssignmentService.js';
import { NotificationService } from '../services/notification.service.js';
import { StorageService } from '../services/storageService.js';

const prisma = new PrismaClient();

/**
 * GET /api/v1/workers
 * ADMIN: List all workers with specializations & assignment counts
 */
export const getAllWorkers = async (req, res) => {
  try {
    const workers = await prisma.workerProfile.findMany({
      where: {
        user: { isActive: true },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, avatarUrl: true, isActive: true },
        },
        assignments: {
          where: { status: { in: ['PENDING', 'ACCEPTED'] } },
          include: {
            order: { select: { id: true, orderNumber: true, eventType: true, eventDate: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: workers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/workers
 * ADMIN: Register new worker user & profile
 */
export const createWorker = async (req, res) => {
  try {
    const { email, name, phone, specialization = [], experienceYrs = 0, avatarUrl } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Worker email and name are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const finalAvatar = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (user) {
      if (user.role === 'WORKER') {
        return res.status(400).json({ success: false, message: 'Worker with this email already exists.' });
      }
      // Upgrade existing customer user to worker role
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'WORKER', name, phone: phone || user.phone, avatarUrl: finalAvatar },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name,
          phone,
          role: 'WORKER',
          avatarUrl: finalAvatar,
        },
      });
    }

    // Create or update WorkerProfile
    const profile = await prisma.workerProfile.upsert({
      where: { userId: user.id },
      update: {
        specialization,
        experienceYrs: Number(experienceYrs),
      },
      create: {
        userId: user.id,
        specialization,
        experienceYrs: Number(experienceYrs),
      },
      include: {
        user: true,
      },
    });

    return res.status(201).json({ success: true, data: profile });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/v1/workers/:id
 * ADMIN: Update worker details & specializations
 */
export const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, specialization, experienceYrs, isAvailable } = req.body;

    const existing = await prisma.workerProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    }

    if (name || phone) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: {
          ...(name && { name }),
          ...(phone !== undefined && { phone }),
        },
      });
    }

    const updated = await prisma.workerProfile.update({
      where: { id },
      data: {
        ...(specialization && { specialization }),
        ...(experienceYrs !== undefined && { experienceYrs: Number(experienceYrs) }),
        ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
      },
      include: { user: true },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/workers/:workerId/availability
 * Fetch worker schedule & leave records
 */
export const getWorkerAvailability = async (req, res) => {
  try {
    const { workerId } = req.params;

    let profile = await prisma.workerProfile.findUnique({ where: { id: workerId } });
    if (!profile) {
      profile = await prisma.workerProfile.findUnique({ where: { userId: workerId } });
    }

    const targetId = profile ? profile.id : workerId;

    const availabilities = await prisma.workerAvailability.findMany({
      where: { workerId: targetId },
      orderBy: { date: 'asc' },
    });

    const assignments = await prisma.workerAssignment.findMany({
      where: { workerId: targetId },
      orderBy: { assignedAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            eventType: true,
            eventDate: true,
            startTime: true,
            endTime: true,
            venueAddress: true,
            customer: { select: { name: true, phone: true, email: true } },
          },
        },
      },
    });

    return res.json({
      success: true,
      data: {
        availabilities,
        assignments,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/workers/availability/set-status
 * ADMIN / WORKER: Set availability status for specific date
 */
export const setWorkerAvailability = async (req, res) => {
  try {
    const { workerId, date, status } = req.body; // status: AVAILABLE, UNAVAILABLE, ON_LEAVE, BUSY

    if (!workerId || !date || !status) {
      return res.status(400).json({ success: false, message: 'Worker ID, date, and status are required.' });
    }

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const record = await prisma.workerAvailability.create({
      data: {
        workerId,
        date: dateObj,
        status,
      },
    });

    return res.status(201).json({ success: true, data: record });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/workers/availability/check-conflicts
 * Conflict-detection algorithm evaluating workers for an event window
 */
export const checkWorkerConflicts = async (req, res) => {
  try {
    const { workerIds = [], eventStart, eventEnd } = req.body;

    const results = [];
    for (const id of workerIds) {
      const worker = await prisma.workerProfile.findUnique({
        where: { id },
        include: {
          user: { select: { name: true, email: true } },
          assignments: {
            where: { status: { in: ['PENDING', 'ACCEPTED'] } },
            include: { order: true },
          },
          availabilities: true,
        },
      });

      if (!worker) continue;

      const existingAssignments = worker.assignments.map((a) => ({
        orderId: a.order.orderNumber,
        eventName: a.order.eventType,
        eventStart: a.order.eventDate,
        eventEnd: a.order.eventDate,
      }));

      const leaveRecords = worker.availabilities
        .filter((av) => av.status === 'ON_LEAVE' || av.status === 'UNAVAILABLE')
        .map((av) => ({
          startDate: av.date,
          endDate: av.date,
        }));

      const evaluation = WorkerAssignmentService.checkWorkerConflict({
        workerId: id,
        eventStart,
        eventEnd,
        existingAssignments,
        leaveRecords,
      });

      results.push({
        workerId: id,
        workerName: worker.user.name,
        specialization: worker.specialization,
        hasConflict: evaluation.hasConflict,
        reason: evaluation.reason,
        message: evaluation.message,
      });
    }

    return res.json({ success: true, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/workers/apply
 * PUBLIC: Self-registration for new crew applicants
 */
export const applyWorker = async (req, res) => {
  try {
    const { name, email, phone, experienceYrs = 0, specialization = [], avatarUrl } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Full name and email address are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (user) {
      if (user.isActive && user.role === 'WORKER') {
        return res.status(400).json({ success: false, message: 'A crew account with this email is already registered and active.' });
      }
      // Re-submit application
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name,
          phone: phone || user.phone,
          role: 'WORKER',
          isActive: false, // Pending admin approval
          status: 'PENDING',
          avatarUrl: avatarUrl || user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name,
          phone,
          role: 'WORKER',
          isActive: false, // Pending admin approval
          status: 'PENDING',
          avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        },
      });
    }

    const profile = await prisma.workerProfile.upsert({
      where: { userId: user.id },
      update: {
        specialization,
        experienceYrs: Number(experienceYrs),
        status: 'PENDING',
      },
      create: {
        userId: user.id,
        specialization,
        experienceYrs: Number(experienceYrs),
        status: 'PENDING',
      },
      include: { user: true },
    });

    return res.status(201).json({
      success: true,
      message: 'Application Submitted! Admin will review and activate your account shortly.',
      data: profile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/workers/pending
 * ADMIN: Get all applicant workers waiting for approval
 */
export const getPendingWorkers = async (req, res) => {
  try {
    const pendingWorkers = await prisma.workerProfile.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, avatarUrl: true, isActive: true, status: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: pendingWorkers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/v1/workers/:id/approve
 * ADMIN: Approve applicant worker profile and grant access
 */
export const approveWorker = async (req, res) => {
  try {
    const { id } = req.params;

    let profile = await prisma.workerProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!profile) {
      profile = await prisma.workerProfile.findUnique({
        where: { userId: id },
        include: { user: true },
      });
    }

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    }

    await prisma.user.update({
      where: { id: profile.userId },
      data: {
        role: 'WORKER',
        isActive: true,
        status: 'APPROVED',
      },
    });

    await prisma.workerProfile.update({
      where: { id: profile.id },
      data: {
        status: 'APPROVED',
      },
    });

    // Notify Worker
    await NotificationService.dispatch({
      eventType: 'WORKER_APPROVED',
      payload: {
        workerUserId: profile.userId,
        workerEmail: profile.user.email,
        workerName: profile.user.name,
      },
    });

    return res.json({
      success: true,
      message: `Worker account for ${profile.user.name} approved and activated successfully.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/v1/workers/:id/reject
 * ADMIN: Reject applicant worker application
 */
export const rejectWorker = async (req, res) => {
  try {
    const { id } = req.params;

    let profile = await prisma.workerProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!profile) {
      profile = await prisma.workerProfile.findUnique({
        where: { userId: id },
        include: { user: true },
      });
    }

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    }

    await prisma.user.update({
      where: { id: profile.userId },
      data: {
        role: 'CUSTOMER',
        isActive: true,
        status: 'REJECTED',
      },
    });

    await prisma.workerProfile.update({
      where: { id: profile.id },
      data: {
        status: 'REJECTED',
      },
    });

    return res.json({
      success: true,
      message: 'Worker application rejected successfully.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/worker/orders/:orderId/upload-media
 * WORKER: Upload site verification setup photo (BEFORE_SETUP or AFTER_SETUP)
 */
export const uploadExecutionMedia = async (req, res) => {
  try {
    const { orderId } = req.params;
    const workerId = req.user.userId;
    const { mediaType, imageUrl, fileName = 'execution_photo.jpg' } = req.body;

    if (!mediaType || !['BEFORE_SETUP', 'AFTER_SETUP'].includes(mediaType)) {
      return res.status(400).json({
        success: false,
        message: 'Valid mediaType (BEFORE_SETUP, AFTER_SETUP) is required.',
      });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const savedUrl = StorageService.savePhoto(imageUrl, fileName);

    const media = await prisma.executionMedia.create({
      data: {
        orderId,
        workerId,
        mediaType,
        imageUrl: savedUrl,
      },
      include: {
        worker: { select: { name: true, phone: true } },
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        orderId,
        actorId: workerId,
        action: `EXECUTION_PHOTO_UPLOADED_${mediaType}`,
        details: JSON.stringify({ mediaId: media.id, imageUrl: savedUrl }),
      },
    });

    // Dispatch Notification
    await NotificationService.dispatch({
      eventType: 'EXECUTION_PHOTO_UPLOADED',
      payload: {
        orderId,
        orderNumber: order.orderNumber,
        workerId,
        mediaType,
        imageUrl: savedUrl,
      },
    });

    return res.status(201).json({
      success: true,
      message: `${mediaType} photo uploaded successfully.`,
      data: media,
    });
  } catch (error) {
    console.error('uploadExecutionMedia error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/worker/my-orders
 * WORKER: Fetch single list of assigned orders for worker operations
 */
export const getWorkerMyOrders = async (req, res) => {
  try {
    const userId = req.user.userId;

    let workerProfile = await prisma.workerProfile.findUnique({
      where: { userId },
    });

    if (!workerProfile) {
      return res.json({ success: true, data: [] });
    }

    const assignments = await prisma.workerAssignment.findMany({
      where: {
        workerId: workerProfile.id,
        status: 'ACCEPTED',
      },
      include: {
        order: {
          include: {
            customer: { select: { name: true, phone: true, email: true } },
            orderItems: true,
            quotations: { orderBy: { versionNumber: 'desc' }, take: 1 },
            executionMedia: {
              include: {
                worker: { select: { name: true, phone: true } },
              },
            },
          },
        },
      },
    });

    const orders = assignments.map(a => a.order);
    return res.json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
