import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../services/notification.service.js';

const prisma = new PrismaClient();

async function runTest() {
  console.log('=== LOOP 126: TRANSACTIONAL EMAIL SERVICE & TEMPLATES TEST ===');

  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No users found in database to run integration test.');
    process.exit(1);
  }

  // 1. Test ORDER_SUBMITTED Inquiry Acknowledgment & Admin Alert
  console.log('\n--- Case 1: ORDER_SUBMITTED Event ---');
  await NotificationService.dispatch({
    eventType: 'ORDER_SUBMITTED',
    payload: {
      orderId: 'test-order-id-126',
      orderNumber: 'BS-2026-TEST-126',
      customerName: user.name || 'Valued Customer',
      customerEmail: user.email,
      eventDate: new Date(),
      venueAddress: 'Bhakti Studio Testing Grounds',
      eventType: 'DevOps Automated Test',
    },
  });
  console.log('✓ Dispatched ORDER_SUBMITTED successfully.');

  // 2. Test QUOTATION_ISSUED Event
  console.log('\n--- Case 2: QUOTATION_ISSUED Event ---');
  await NotificationService.dispatch({
    eventType: 'QUOTATION_ISSUED',
    payload: {
      customerId: user.id,
      customerName: user.name || 'Valued Customer',
      customerEmail: user.email,
      orderNumber: 'BS-2026-TEST-126',
      eventType: 'DevOps Automated Test',
      grandTotal: 52400.00,
    },
  });
  console.log('✓ Dispatched QUOTATION_ISSUED successfully.');

  // 3. Test WORKER_ASSIGNED Event
  console.log('\n--- Case 3: WORKER_ASSIGNED Event ---');
  await NotificationService.dispatch({
    eventType: 'WORKER_ASSIGNED',
    payload: {
      workerUserId: user.id,
      workerEmail: user.email,
      workerName: user.name || 'Crew Member',
      workerPhone: '919876543210',
      role: 'Lead Sound Engineer',
      orderNumber: 'BS-2026-TEST-126',
      eventType: 'DevOps Automated Test',
      eventDate: new Date(),
      venueAddress: 'Bhakti Studio Testing Grounds',
    },
  });
  console.log('✓ Dispatched WORKER_ASSIGNED successfully.');

  // 4. Test PAYMENT_RECEIVED Event
  console.log('\n--- Case 4: PAYMENT_RECEIVED Event ---');
  await NotificationService.dispatch({
    eventType: 'PAYMENT_RECEIVED',
    payload: {
      customerId: user.id,
      customerName: user.name || 'Valued Customer',
      customerEmail: user.email,
      orderId: 'test-order-id-126',
      orderNumber: 'BS-2026-TEST-126',
      amount: 15720.00,
      eventType: 'DevOps Automated Test',
    },
  });
  console.log('✓ Dispatched PAYMENT_RECEIVED successfully.');

  // 5. Test WORKER_PAYOUT_SETTLED Event
  console.log('\n--- Case 5: WORKER_PAYOUT_SETTLED Event ---');
  await NotificationService.dispatch({
    eventType: 'WORKER_PAYOUT_SETTLED',
    payload: {
      workerId: user.id,
      workerName: user.name || 'Crew Member',
      workerEmail: user.email,
      totalAmount: 4500.00,
      payoutId: 'payout-126-id',
    },
  });
  console.log('✓ Dispatched WORKER_PAYOUT_SETTLED successfully.');

  // Wait a small buffer to let the async Promise.resolve().then() dispatches print their logs
  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log('\nALL LOOP 126 TRANSACTIONAL EMAIL TESTS COMPLETED SUCCESSFULLY!');
  await prisma.$disconnect();
}

runTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
