import { PrismaClient } from '@prisma/client';
import { WorkerAssignmentService } from '../services/workerAssignmentService.js';

const prisma = new PrismaClient();

/**
 * POST /api/v1/assignments
 * ADMIN: Create & dispatch worker assignments to an order (Atomic Concurrency Transaction)
 */
export const createAssignments = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { orderId, assignments = [] } = req.body; // assignments: [{ workerId, assignedRole }]

    if (!orderId || assignments.length === 0) {
      return res.status(400).json({ success: false, message: 'Order ID and assignments array are required.' });
    }

    // Atomic Concurrency Isolation with prisma.$transaction
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) {
        throw new Error('Order not found.');
      }

      const createdAssignments = [];
      const conflictWarnings = [];

      for (const item of assignments) {
        // Concurrency Check: Verify worker not locked in another transaction
        const worker = await tx.workerProfile.findUnique({
          where: { id: item.workerId },
          include: {
            user: true,
            assignments: {
              where: { status: { in: ['PENDING', 'ACCEPTED'] } },
              include: { order: true },
            },
            availabilities: true,
          },
        });

        if (!worker) continue;

        // Run Conflict Detection
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
          workerId: item.workerId,
          eventStart: order.eventDate,
          eventEnd: order.eventDate,
          existingAssignments,
          leaveRecords,
        });

        if (evaluation.hasConflict) {
          conflictWarnings.push({
            workerName: worker.user.name,
            reason: evaluation.message,
          });
        }

        // Create assignment record
        const assignmentRecord = await tx.workerAssignment.create({
          data: {
            orderId,
            workerProfileId: item.workerId,
            assignedRole: item.assignedRole,
            status: 'PENDING',
          },
          include: {
            workerProfile: { include: { user: true } },
          },
        });

        createdAssignments.push(assignmentRecord);
      }

      // Update order status to WORKERS_ASSIGNED
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'WORKERS_ASSIGNED' },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          orderId,
          actorId: adminId,
          action: 'WORKERS_ASSIGNED',
          details: JSON.stringify({
            assignedWorkerCount: createdAssignments.length,
            warnings: conflictWarnings,
          }),
        },
      });

      return {
        assignments: createdAssignments,
        orderStatus: updatedOrder.status,
        conflictWarnings,
        orderNumber: order.orderNumber,
      };
    });

    return res.status(201).json({
      success: true,
      message: `Assigned ${result.assignments.length} workers to Order #${result.orderNumber}.`,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/assignments/:id/respond
 * WORKER: Accept or reject assigned job
 */
export const respondToAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { action, rejectionReason } = req.body; // action: 'ACCEPT' | 'REJECT'

    const assignment = await prisma.workerAssignment.findUnique({
      where: { id },
      include: {
        workerProfile: { include: { user: true } },
        order: true,
      },
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    if (assignment.workerProfile.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized to respond to this assignment.' });
    }

    const nextStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';

    const updated = await prisma.workerAssignment.update({
      where: { id },
      data: {
        status: nextStatus,
        ...(rejectionReason && { rejectionReason }),
      },
    });

    // If accepted, set worker availability status to BUSY on event date
    if (action === 'ACCEPT' && assignment.order?.eventDate) {
      await prisma.workerAvailability.create({
        data: {
          workerId: assignment.workerProfileId,
          date: assignment.order.eventDate,
          status: 'BUSY',
        },
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        orderId: assignment.orderId,
        actorId: userId,
        action: `WORKER_ASSIGNMENT_${nextStatus}`,
        details: JSON.stringify({ assignmentId: id, workerName: assignment.workerProfile.user.name, rejectionReason }),
      },
    });

    return res.json({
      success: true,
      message: `Assignment status updated to ${nextStatus}.`,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/assignments/my-jobs
 * WORKER: Get jobs assigned to authenticated worker
 */
export const getWorkerAssignedJobs = async (req, res) => {
  try {
    const userId = req.user.userId;

    let workerProfile = await prisma.workerProfile.findUnique({
      where: { userId },
    });

    const targetIds = [userId];
    if (workerProfile) targetIds.push(workerProfile.id);

    const assignments = await prisma.workerAssignment.findMany({
      where: {
        workerId: { in: targetIds },
      },
      orderBy: { assignedAt: 'desc' },
      include: {
        order: {
          include: {
            customer: { select: { name: true, phone: true, email: true } },
            orderItems: true,
            quotations: { orderBy: { versionNumber: 'desc' }, take: 1 },
          },
        },
      },
    });

    return res.json({ success: true, data: assignments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
