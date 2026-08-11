import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../services/notification.service.js';

const prisma = new PrismaClient();

async function verifyLoop15Features() {
  console.log('--- TEST 1: Distance & Outstation Surcharge Flag in DB ---');
  const user = await prisma.user.findFirst();
  const testOrder = await prisma.order.create({
    data: {
      orderNumber: 'BS-2026-LOOP15-' + Math.floor(Math.random() * 9000),
      customerId: user.id,
      eventType: 'Sangeet Mahotsav (Custom Voice)',
      eventDate: new Date('2026-09-10'),
      startTime: '05:00 PM',
      endTime: '11:00 PM',
      venueAddress: 'Lonavala Resort Outstation',
      distanceKm: 65.5,
      requiresCustomTransport: true,
      status: 'SUBMITTED',
      paymentStatus: 'PENDING',
    },
  });
  console.log('✓ Created Outstation Order #' + testOrder.orderNumber);
  console.log('✓ Distance:', testOrder.distanceKm, 'km | Requires Custom Transport:', testOrder.requiresCustomTransport);

  console.log('\n--- TEST 2: WhatsApp Deep-Link Fallback Test ---');
  await NotificationService.dispatch({
    eventType: 'QUOTATION_APPROVED',
    payload: {
      customerId: user.id,
      customerPhone: '919876543210',
      orderNumber: testOrder.orderNumber,
      totalAmount: 45000,
    },
  });

  await prisma.$disconnect();
}

verifyLoop15Features();
