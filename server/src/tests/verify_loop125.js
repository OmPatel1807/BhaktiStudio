import { PrismaClient } from '@prisma/client';
import { logGenericDiffEvent } from '../utils/auditLogger.js';

const prisma = new PrismaClient();

async function runTest() {
  console.log('=== LOOP 125: DYNAMIC AUDIT TRAIL ENGINE INTEGRATION TEST ===');

  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No users found in database to run integration test.');
    process.exit(1);
  }

  // Mock Request
  const mockReq = {
    user: {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    headers: {
      'x-forwarded-for': '198.51.100.42',
    },
    ip: '127.0.0.1',
  };

  // Mock Objects
  const previousState = {
    status: 'DRAFT',
    totalAmount: 15000,
    venueAddress: 'Old Venue Suite 101',
    assignedWorkersCount: 1,
  };

  const updatedState = {
    status: 'QUOTATION_SENT',
    totalAmount: 18500,
    venueAddress: 'New Grand Palace Arena',
    assignedWorkersCount: 3,
  };

  console.log('Step 1: Logging dynamic diff audit event...');
  await logGenericDiffEvent({
    req: mockReq,
    action: 'TEST_DYNAMIC_DIFF',
    category: 'ORDER',
    previous: previousState,
    updated: updatedState,
    metadata: {
      orderRef: 'BS-TEST-L125',
    },
  });
  console.log('✅ Step 1: Log created.');

  console.log('Step 2: Retrieving logged audit event...');
  const latestLog = await prisma.auditLog.findFirst({
    where: {
      actorId: user.id,
      action: 'TEST_DYNAMIC_DIFF',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!latestLog) {
    console.error('❌ Failed to retrieve the logged audit event.');
    process.exit(1);
  }

  const detailsObj = JSON.parse(latestLog.details);
  console.log('✅ Log successfully retrieved.');
  console.log('Details payload:', JSON.stringify(detailsObj, null, 2));

  // Assertions
  if (detailsObj.ipAddress !== '198.51.100.42') {
    console.error(`❌ Expected IP Address to be 198.51.100.42, got ${detailsObj.ipAddress}`);
    process.exit(1);
  }
  if (detailsObj.delta.status.old !== 'DRAFT' || detailsObj.delta.status.new !== 'QUOTATION_SENT') {
    console.error('❌ Delta status values mismatch.');
    process.exit(1);
  }
  if (detailsObj.delta.totalAmount.old !== 15000 || detailsObj.delta.totalAmount.new !== 18500) {
    console.error('❌ Delta totalAmount values mismatch.');
    process.exit(1);
  }
  if (detailsObj.metadata.actorEmail !== user.email) {
    console.error('❌ Metadata actorEmail mismatch.');
    process.exit(1);
  }

  console.log('\nStep 3: Cleaning up test audit record...');
  await prisma.auditLog.delete({ where: { id: latestLog.id } });
  console.log('✅ Step 3: Cleanup completed.');

  console.log('\nALL LOOP 125 DYNAMIC DIFF AUDIT TESTS PASSED SUCCESSFULLY!');
  await prisma.$disconnect();
}

runTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
