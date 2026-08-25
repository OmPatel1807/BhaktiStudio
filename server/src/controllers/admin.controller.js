import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../services/notification.service.js';

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
    const { items = [], discount = 0, discountType = 'FIXED', setupFee = 0, transportFee = 0, technicianFee = 0, gstRate = 18.0, action, notes } = req.body;

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

    let itemsSubtotal = 0;
    for (const item of dbOrderItems) {
      const rate = Number(item.finalRate || item.estimatedRate || 0);
      const qty = Number(item.quantity || 1);
      const days = Number(order.totalDays || 1);
      itemsSubtotal += rate * qty * days;
    }
    itemsSubtotal = round2(itemsSubtotal);

    const grossSubtotal = round2(
      itemsSubtotal +
      Number(setupFee) +
      Number(transportFee) +
      Number(technicianFee)
    );

    const discountVal = Number(discount);
    const discountAmount = discountType === 'PERCENT'
      ? round2(itemsSubtotal * (discountVal / 100))
      : round2(discountVal);

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
        setupFee: round2(Number(setupFee)),
        transportFee: round2(Number(transportFee)),
        technicianFee: round2(Number(technicianFee)),
        discounts: discountAmount,
        taxAmount,
        totalAmount: grandTotal,
        advanceFee,
        isAdminApproved: true,
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
        orderNumber: order.orderNumber,
        eventType: order.eventType,
      },
    });

    return res.json({ success: true, quotation, order: updatedOrder });
  } catch (error) {
    console.error('updateOrderQuotation error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
