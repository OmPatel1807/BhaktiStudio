import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../services/notification.service.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { resolveItemBaseRateAndTotal } from '../services/pricingEngine.js';

const prisma = new PrismaClient();

export const promoteUserToAdmin = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Target email is required.' });
    }

    const targetEmail = email.toLowerCase().trim();
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: `No account found with email ${targetEmail}. Please ask them to register first.`
      });
    }

    // Update user role to ADMIN and clear any blocking worker status
    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        role: 'ADMIN',
        status: 'APPROVED',
        isActive: true,
      }
    });

    // Create Audit Log for role adjustment
    await logAuditEvent({
      userId: req.user?.userId || targetUser.id,
      action: 'ADMIN_ROLE_PROMOTED',
      category: 'USER_MANAGEMENT',
      details: { promotedUserId: targetUser.id, promotedEmail: targetEmail },
    });

    return res.json({
      success: true,
      message: `User ${targetEmail} is now an ADMIN! They can log in immediately.`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      }
    });
  } catch (error) {
    console.error('Promote Admin Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to promote user.' });
  }
};

export const updateOrderQuotation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      items = [],
      discount,
      discounts,
      discountType = 'FLAT',
      setupCost,
      setupFee,
      logisticsCost,
      transportFee,
      techSupportCost,
      technicianFee,
      gstRate = 18.0,
      action,
      notes
    } = req.body;

    const finalSetupFee = Number(setupCost !== undefined ? setupCost : (setupFee !== undefined ? setupFee : 0));
    const finalTransportFee = Number(logisticsCost !== undefined ? logisticsCost : (transportFee !== undefined ? transportFee : 0));
    const finalTechnicianFee = Number(techSupportCost !== undefined ? techSupportCost : (technicianFee !== undefined ? technicianFee : 0));
    const finalDiscount = Number(discount !== undefined ? discount : (discounts !== undefined ? discounts : 0));

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        quotations: { orderBy: { versionNumber: 'desc' } },
        customer: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (action === 'REJECT') {
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'REJECTED' },
      });

      await NotificationService.dispatch({
        eventType: 'ORDER_REJECTED',
        payload: {
          customerId: order.customerId,
          orderNumber: order.orderNumber,
        },
      });

      return res.json({ success: true, order: updatedOrder });
    }

    // Update order items rates/quantities if provided from frontend
    for (const item of items) {
      if (item.id) {
        await prisma.orderItem.update({
          where: { id: item.id },
          data: {
            finalRate: Number(item.finalRate || item.rate || item.estimatedRate || 0),
            quantity: Number(item.quantity || 1),
          },
        });
      }
    }

    // Fetch updated order items to calculate subtotal
    const dbOrderItems = await prisma.orderItem.findMany({
      where: { orderId },
    });

    const round2 = (num) => Math.round((Number(num) || 0) * 100) / 100;
    const orderDays = Number(order.durationDays || order.totalDays || 1);

    let itemsSubtotal = 0;
    for (const item of dbOrderItems) {
      const resolved = resolveItemBaseRateAndTotal(item, orderDays);
      itemsSubtotal += resolved.total;
    }
    itemsSubtotal = round2(itemsSubtotal);

    const overheadsTotal = finalSetupFee + finalTransportFee + finalTechnicianFee;
    const grossSubtotal = round2(itemsSubtotal + overheadsTotal);

    let discountAmount = finalDiscount;
    if (discountType === 'PERCENTAGE' || discountType === 'PERCENT') {
      discountAmount = round2((grossSubtotal * finalDiscount) / 100);
    } else {
      discountAmount = round2(finalDiscount);
    }

    const taxableAmount = Math.max(0, round2(grossSubtotal - discountAmount));
    const taxAmount = round2((taxableAmount * Number(gstRate)) / 100);
    const grandTotal = round2(taxableAmount + taxAmount);
    const advanceFee = round2((grandTotal * 30) / 100); // 30% advance standard

    // Determine next version number
    const latestVersion = order.quotations[0];
    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Create new QuotationVersion record
    const quotation = await prisma.quotationVersion.create({
      data: {
        orderId,
        versionNumber: nextVersionNumber,
        subtotal: grossSubtotal,
        setupFee: round2(finalSetupFee),
        transportFee: round2(finalTransportFee),
        technicianFee: round2(finalTechnicianFee),
        discounts: discountAmount,
        taxAmount,
        totalAmount: grandTotal,
        advanceFee,
        isAdminApproved: true,
      },
    });

    // Create Audit Log for quotation version update
    await logAuditEvent({
      userId: req.user.userId,
      orderId,
      action: 'QUOTATION_EDITED',
      category: 'FINANCIAL',
      details: {
        versionNumber: nextVersionNumber,
        oldTotal: latestVersion?.totalAmount || 0,
        newTotal: grandTotal,
        setupFee: round2(finalSetupFee),
        transportFee: round2(finalTransportFee),
        technicianFee: round2(finalTechnicianFee),
        discount: discountAmount,
      },
    });

    // Update order status to QUOTATION_SENT
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'QUOTATION_SENT',
      },
    });

    // Dispatch Notification
    await NotificationService.dispatch({
      eventType: 'QUOTATION_ISSUED',
      payload: {
        customerId: order.customerId,
        customerName: order.customer?.name || 'Customer',
        customerEmail: order.customer?.email,
        orderNumber: order.orderNumber,
        eventType: order.eventType,
        grandTotal,
      },
    });

    return res.json({ success: true, quotation, order: updatedOrder });
  } catch (error) {
    console.error('updateOrderQuotation error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/admin/workers/:workerId/payout
 * ADMIN: Settle/issue worker payout
 */
export const createWorkerPayout = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { baseAmount, bonusAmount = 0, payoutMode, orderId, transactionRef, notes } = req.body;

    if (!baseAmount || !payoutMode) {
      return res.status(400).json({ success: false, message: 'Base Amount and Payout Mode are required.' });
    }

    const worker = await prisma.user.findUnique({ where: { id: workerId } });
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    const baseVal = Number(baseAmount);
    const bonusVal = Number(bonusAmount);
    const totalVal = baseVal + bonusVal;

    const payout = await prisma.workerPayout.create({
      data: {
        workerId,
        orderId: orderId || null,
        baseAmount: baseVal,
        bonusAmount: bonusVal,
        totalAmount: totalVal,
        payoutMode,
        transactionRef: transactionRef || null,
        notes: notes || null,
        status: 'PAID',
      },
      include: {
        order: true,
      },
    });

    // Create Audit Log
    await logAuditEvent({
      userId: req.user.userId,
      orderId: orderId || null,
      action: 'WORKER_PAYOUT_SETTLED',
      category: 'FINANCIAL',
      details: { payoutId: payout.id, workerName: worker.name || worker.email, totalAmount: totalVal },
    });

    // Dispatch Notification
    await NotificationService.dispatch({
      eventType: 'WORKER_PAYOUT_SETTLED',
      payload: {
        workerId,
        workerName: worker.name || 'Crew Member',
        workerEmail: worker.email,
        totalAmount: totalVal,
        payoutId: payout.id,
      },
    });

    return res.status(201).json({ success: true, message: 'Payout settled successfully.', data: payout });
  } catch (error) {
    console.error('createWorkerPayout error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/admin/workers/payouts-summary
 * ADMIN: Global payroll analytics summary
 */
export const getWorkerPayoutsSummary = async (req, res) => {
  try {
    const aggregations = await prisma.workerPayout.aggregate({
      _sum: {
        totalAmount: true,
      },
    });
    const totalPaid = aggregations._sum.totalAmount || 0;

    const completedAssignments = await prisma.workerAssignment.findMany({
      where: {
        status: 'ACCEPTED',
        order: {
          status: { in: ['EVENT_COMPLETED', 'COMPLETED'] },
        },
      },
      include: {
        order: true,
        worker: { include: { user: true } },
      },
    });

    let unpaidCount = 0;
    for (const asg of completedAssignments) {
      const workerUser = asg.worker.user;
      const payoutExists = await prisma.workerPayout.findFirst({
        where: {
          orderId: asg.orderId,
          workerId: workerUser.id,
        },
      });
      if (!payoutExists) {
        unpaidCount++;
      }
    }

    const unsettledDues = unpaidCount * 2000;

    return res.json({
      success: true,
      data: {
        totalPaid,
        unsettledDues,
      },
    });
  } catch (error) {
    console.error('getWorkerPayoutsSummary error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
