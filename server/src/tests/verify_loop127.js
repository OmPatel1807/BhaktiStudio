import { PrismaClient } from '@prisma/client';
import { getAdminNotificationRecipients } from '../services/email.service.js';
import { NotificationService } from '../services/notification.service.js';

const prisma = new PrismaClient();

async function runTest() {
  console.log('=== LOOP 127: MULTI-ADMIN DYNAMIC EMAIL NOTIFICATION BROADCAST TEST ===');

  // Set environment variables for test
  process.env.ADMIN_NOTIFICATION_EMAIL = 'env.admin1@example.com, env.admin2@example.com';

  console.log('Step 1: Fetching admins dynamically from DB + ENV...');
  const recipients = await getAdminNotificationRecipients();
  console.log('✓ Found recipients:', recipients);

  // Assertions
  if (!recipients.includes('env.admin1@example.com')) {
    console.error('❌ Expected env.admin1@example.com to be in recipients list.');
    process.exit(1);
  }
  if (!recipients.includes('env.admin2@example.com')) {
    console.error('❌ Expected env.admin2@example.com to be in recipients list.');
    process.exit(1);
  }

  // Find all DB admins to confirm they are present
  const dbAdmins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { email: true }
  });
  for (const dbAdmin of dbAdmins) {
    if (dbAdmin.email && !recipients.includes(dbAdmin.email)) {
      console.error(`❌ Expected DB admin ${dbAdmin.email} to be in recipients list.`);
      process.exit(1);
    }
  }

  console.log('Step 2: Triggering ORDER_SUBMITTED notification dispatch broadcast...');
  await NotificationService.dispatch({
    eventType: 'ORDER_SUBMITTED',
    payload: {
      orderId: 'test-order-id-127',
      orderNumber: 'BS-2026-TEST-127',
      customerName: 'Test Customer L127',
      customerEmail: 'customer@example.com',
      eventDate: new Date(),
      venueAddress: 'Bhakti Studio Testing Grounds',
      eventType: 'Multi-Admin Dispatch Test',
    },
  });

  // Wait a small buffer to let the async Promise resolve/then dispatches print their logs
  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log('\nALL LOOP 127 MULTI-ADMIN BROADCAST TESTS COMPLETED SUCCESSFULLY!');
  await prisma.$disconnect();
}

runTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
