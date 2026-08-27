import { PrismaClient } from '@prisma/client';
import { PricingEngineService } from '../services/pricingEngine.js';
import { sanitizeOrderFinancials } from './order.controller.js';

const prisma = new PrismaClient();

/**
 * POST /api/v1/quotations/:orderId
 * ADMIN: Create new versioned quotation (V1 -> V2) and update order status to QUOTATION_SENT
 */
export const createQuotationVersion = async (req, res) => {
  try {
    const { orderId } = req.params;
    const adminId = req.user.userId;
    const {
      setupFee = 0,
      transportFee = 0,
      technicianFee = 0,
      discounts = 0,
      taxPercentage = 18.0,
      gstRate,
      customLineItems = [],
      items = [],
    } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        quotations: { orderBy: { versionNumber: 'desc' } },
        orderItems: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const effectiveGstRate = Number(gstRate !== undefined ? gstRate : taxPercentage);

    // Determine next version number
    const latestVersion = order.quotations[0];
    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Update order items rates if provided from frontend
    for (const item of items) {
      if (item.id) {
        await prisma.orderItem.update({
          where: { id: item.id },
          data: {
            finalRate: Number(item.finalRate || item.estimatedRate),
            quantity: Number(item.quantity),
          },
        });
      }
    }

    const round2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

    // LOOP 40: Always re-fetch order items from DB to compute equipment subtotal
    // This guarantees equipment costs are included even if frontend sends empty items[]
    const dbOrderItems = await prisma.orderItem.findMany({
      where: { orderId },
    });

    let itemsSubtotal = 0;
    for (const item of dbOrderItems) {
      const rate = Number(item.finalRate || item.estimatedRate || 0);
      const qty = Number(item.quantity || 1);
      const days = Number(item.days || 1);
      itemsSubtotal += rate * qty * days;
    }
    itemsSubtotal = round2(itemsSubtotal);

    const customChargesSum = round2(
      (customLineItems || []).reduce(
        (sum, item) => sum + (Number(item.amount) || 0),
        0
      )
    );

    const grossSubtotal = round2(
      itemsSubtotal +
        Number(setupFee || 0) +
        Number(transportFee || 0) +
        Number(technicianFee || 0) +
        customChargesSum
    );

    const discountVal = Number(discounts || 0);
    const discountAmount = req.body.discountType === 'PERCENT'
      ? round2(itemsSubtotal * (discountVal / 100))
      : round2(discountVal);

    const taxableAmount = Math.max(0, round2(grossSubtotal - discountAmount));
    const taxAmount = round2((taxableAmount * effectiveGstRate) / 100);
    const totalAmount = round2(taxableAmount + taxAmount);
    const { advancePayPercentage } = PricingEngineService.getSettings().pricingRules;
    const advanceFee = round2((totalAmount * advancePayPercentage) / 100);

    // Create new QuotationVersion record
    const newQuotation = await prisma.quotationVersion.create({
      data: {
        orderId,
        versionNumber: nextVersionNumber,
        subtotal: grossSubtotal,
        setupFee: round2(Number(setupFee || 0)),
        transportFee: round2(Number(transportFee || 0)),
        technicianFee: round2(Number(technicianFee || 0)),
        discounts: discountAmount,
        taxAmount,
        totalAmount,
        advanceFee,
        isAdminApproved: true,
      },
    });

    // Update Order Status to QUOTATION_SENT
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'QUOTATION_SENT',
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        orderId,
        actorId: adminId,
        action: `QUOTATION_V${nextVersionNumber}_APPROVED`,
        details: JSON.stringify({
          version: nextVersionNumber,
          total: totalAmount,
          gstRate: effectiveGstRate,
          customChargesSum,
          discounts: Number(discounts || 0),
        }),
      },
    });

    return res.status(201).json({
      success: true,
      message: `Quotation Version V${nextVersionNumber} issued and sent to customer.`,
      data: {
        quotation: newQuotation,
        orderStatus: updatedOrder.status,
      },
    });
  } catch (error) {
    console.error('Error creating quotation version:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/quotations/:orderId/history
 * Fetch version history for an order
 */
export const getQuotationHistory = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
        quotations: { orderBy: { versionNumber: 'desc' } },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const sanitized = sanitizeOrderFinancials(order);
    return res.json({ success: true, data: sanitized.quotations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/orders/:orderId/quotation-response
 * CUSTOMER: Accept or reject current quotation
 */
export const respondToQuotation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.user.userId;
    const { action, reason } = req.body; // action: 'ACCEPT' | 'REJECT'

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { quotations: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const newStatus = action === 'ACCEPT' ? 'CONFIRMED' : 'DRAFT';
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    await prisma.auditLog.create({
      data: {
        orderId,
        actorId: customerId,
        action: `QUOTATION_${action}ED`,
        details: JSON.stringify({ reason: reason || 'Customer decision' }),
      },
    });

    return res.json({
      success: true,
      message: `Quotation ${action.toLowerCase()}ed successfully.`,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
