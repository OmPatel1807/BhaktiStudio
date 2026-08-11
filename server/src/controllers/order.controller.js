import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { PricingEngineService } from '../services/pricingEngine.js';
import { NotificationService } from '../services/notification.service.js';

const prisma = new PrismaClient();

/**
 * Generate Sequential Order Number (e.g., BS-2026-00101)
 */
async function generateOrderNumber() {
  const currentYear = new Date().getFullYear();
  const count = await prisma.order.count();
  const nextNum = (count + 1).toString().padStart(5, '0');
  return `BS-${currentYear}-${nextNum}`;
}

/**
 * Recalculate price estimation server-side
 */
async function computeServerEstimate({ selectedServices = [], ledWidthFeet, ledHeightFeet, transportDistanceKm }) {
  if (!selectedServices || selectedServices.length === 0) {
    return {
      financialSummary: {
        servicesSubtotal: 0,
        setupFeeTotal: 0,
        transportFee: 0,
        technicianFee: 0,
        subtotal: 0,
        taxableAmount: 0,
        taxPercentage: 18,
        taxAmount: 0,
        grandTotal: 0,
        advanceRequired: 0,
      },
      itemizedList: [],
    };
  }

  const catalog = await prisma.serviceCatalog.findMany({ where: { isActive: true } });

  const customItems = [];
  const itemizedList = [];

  const hasLedWall = selectedServices.some((item) => {
    const catalogMatch = catalog.find((c) => c.id === item.serviceId || c.id === item || c.name === item.name);
    return catalogMatch && (catalogMatch.category === 'DISPLAY' || catalogMatch.name.toUpperCase().includes('LED'));
  });

  let widthFeet = hasLedWall ? (Number(ledWidthFeet) || 12) : 0;
  let heightFeet = hasLedWall ? (Number(ledHeightFeet) || 8) : 0;

  selectedServices.forEach((item) => {
    const catalogMatch = catalog.find((c) => c.id === item.serviceId || c.id === item || c.name === item.name);

    if (catalogMatch) {
      if (catalogMatch.category === 'DISPLAY' || catalogMatch.name.toUpperCase().includes('LED')) {
        itemizedList.push({
          serviceName: catalogMatch.name,
          widthFt: widthFeet,
          heightFt: heightFeet,
          quantity: 1,
          estimatedRate: Number(catalogMatch.baseRate),
        });
      } else {
        const qty = Number(item.quantity) || 1;
        customItems.push({
          name: catalogMatch.name,
          unitRate: Number(catalogMatch.baseRate),
          quantity: qty,
        });
        itemizedList.push({
          serviceName: catalogMatch.name,
          widthFt: null,
          heightFt: null,
          quantity: qty,
          estimatedRate: Number(catalogMatch.baseRate),
        });
      }
    }
  });

  const calculation = PricingEngineService.calculateQuotation({
    widthFeet,
    heightFeet,
    technicianHours: hasLedWall ? 8 : 0,
    transportDistanceKm: Number(transportDistanceKm) || 0,
    customItems,
  });

  return {
    financialSummary: calculation.financialSummary,
    itemizedList,
  };
}

/**
 * POST /api/v1/orders/estimate
 */
export const calculateEstimate = async (req, res) => {
  try {
    const { selectedServices = [], ledWidthFeet, ledHeightFeet, transportDistanceKm } = req.body;
    const estimate = await computeServerEstimate({
      selectedServices,
      ledWidthFeet,
      ledHeightFeet,
      transportDistanceKm,
    });
    return res.json({ success: true, data: estimate });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/orders
 * Create new customer order with V1 Quotation
 */
export const createOrder = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const {
      eventType,
      eventDate,
      startTime,
      endTime,
      venueAddress,
      notes,
      selectedServices = [],
      ledWidthFeet,
      ledHeightFeet,
      transportDistanceKm = 0,
      paymentPreference = 'ONLINE',
    } = req.body;

    if (!eventType || !eventDate || !startTime || !endTime || !venueAddress) {
      return res.status(400).json({
        success: false,
        message: 'Event type, event date, start/end time, and venue address are required.',
      });
    }

    if (!selectedServices || selectedServices.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one service or equipment to proceed with order.',
      });
    }

    const evtDate = new Date(eventDate);

    const estimate = await computeServerEstimate({
      selectedServices,
      ledWidthFeet,
      ledHeightFeet,
      transportDistanceKm,
    });

    const orderNumber = await generateOrderNumber();
    const qrCodeToken = `QR-BS-${uuidv4().substring(0, 8).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        eventType,
        eventDate: evtDate,
        startTime,
        endTime,
        venueAddress,
        notes,
        status: 'SUBMITTED',
        paymentStatus: 'PENDING',
        qrCodeToken,
        ledWidthFeet: ledWidthFeet ? Number(ledWidthFeet) : null,
        ledHeightFeet: ledHeightFeet ? Number(ledHeightFeet) : null,
        distanceKm: transportDistanceKm ? Number(transportDistanceKm) : null,
        requiresCustomTransport: Number(transportDistanceKm) > 25,
        orderItems: {
          create: estimate.itemizedList.map((item) => ({
            serviceName: item.serviceName,
            widthFt: item.widthFt,
            heightFt: item.heightFt,
            quantity: item.quantity,
            estimatedRate: item.estimatedRate,
            finalRate: item.estimatedRate,
          })),
        },
        quotations: {
          create: {
            versionNumber: 1,
            subtotal: estimate.financialSummary.subtotal,
            setupFee: estimate.financialSummary.setupFeeTotal,
            transportFee: estimate.financialSummary.transportFee,
            technicianFee: estimate.financialSummary.technicianFee || 0,
            discounts: 0,
            taxAmount: estimate.financialSummary.taxAmount,
            totalAmount: estimate.financialSummary.grandTotal,
            advanceFee: estimate.financialSummary.advanceRequired || 0,
            isAdminApproved: false,
          },
        },
        auditLogs: {
          create: {
            actorId: customerId,
            action: 'ORDER_SUBMITTED',
            details: JSON.stringify({
              orderNumber,
              grandTotal: estimate.financialSummary.grandTotal,
              paymentPreference,
            }),
          },
        },
      },
      include: {
        orderItems: true,
        quotations: true,
      },
    });

    // Notify Admin
    const customerUser = await prisma.user.findUnique({ where: { id: customerId } });
    await NotificationService.dispatch({
      eventType: 'ORDER_SUBMITTED',
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: customerUser?.name || 'Customer',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      data: {
        order,
        estimationBreakdown: estimate.financialSummary,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/orders/my-orders
 * Fetch authenticated customer's orders
 */
export const getMyOrders = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const orders = await prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: true,
        quotations: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    return res.json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/orders/all
 * ADMIN ONLY: Fetch all customer orders across the platform
 */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        orderItems: true,
        quotations: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
        assignments: {
          include: {
            worker: {
              include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
              },
            },
          },
        },
      },
    });

    return res.json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/orders/:id
 * Fetch single order details by ID
 */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        orderItems: true,
        quotations: {
          orderBy: { versionNumber: 'desc' },
        },
        assignments: {
          include: {
            worker: {
              include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
              },
            },
          },
        },
        payments: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    return res.json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/orders/:orderId/assign-workers
 * ADMIN ONLY: Assign workers/crew members to an order
 */
export const assignWorkersToOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { workerIds = [], assignments = [] } = req.body;
    const adminId = req.user?.userId;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    let targetEntries = [];
    if (assignments.length > 0) {
      targetEntries = assignments;
    } else if (workerIds.length > 0) {
      targetEntries = workerIds.map((id) => ({ workerId: id, assignedRole: 'Event Technician' }));
    }

    const createdAssignments = await prisma.$transaction(async (tx) => {
      await tx.workerAssignment.deleteMany({
        where: { orderId },
      });

      const list = [];
      for (const item of targetEntries) {
        let profile = await tx.workerProfile.findUnique({ where: { id: item.workerId } });
        if (!profile) {
          profile = await tx.workerProfile.findUnique({ where: { userId: item.workerId } });
        }
        if (!profile) continue;

        const record = await tx.workerAssignment.create({
          data: {
            orderId,
            workerId: profile.id,
            assignedRole: item.assignedRole || 'Event Technician',
            status: 'PENDING',
          },
          include: {
            worker: { include: { user: true } },
          },
        });
        list.push(record);
      }

      if (['SUBMITTED', 'CONFIRMED', 'QUOTATION_SENT'].includes(order.status)) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'WORKERS_ASSIGNED' },
        });
      }

      if (adminId) {
        await tx.auditLog.create({
          data: {
            orderId,
            actorId: adminId,
            action: 'CREW_ASSIGNED',
            details: JSON.stringify({ assignedCount: list.length }),
          },
        });
      }

      return list;
    });

    return res.json({
      success: true,
      message: `Assigned ${createdAssignments.length} crew member(s) to Order #${order.orderNumber}.`,
      data: createdAssignments,
    });
  } catch (error) {
    console.error('Assign workers error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/v1/orders/:orderId/status
 * ADMIN: Update order status (e.g. COMPLETED, IN_EXECUTION, CANCELLED) & create audit log
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const adminId = req.user?.userId;

    if (!status) {
      return res.status(400).json({ success: false, message: 'New status is required.' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const oldStatus = order.status;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        orderItems: true,
        quotations: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
    });

    // Create Audit Log
    if (adminId) {
      await prisma.auditLog.create({
        data: {
          orderId,
          actorId: adminId,
          action: 'STATUS_UPDATED',
          details: JSON.stringify({
            oldStatus,
            newStatus: status,
            message: status === 'COMPLETED' ? 'Event completed by Admin' : `Order status changed from ${oldStatus} to ${status}`,
          }),
        },
      });
    }

    return res.json({
      success: true,
      message: `Order #${order.orderNumber} status updated to ${status}.`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
