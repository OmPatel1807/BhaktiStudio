import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import assert from 'assert';
import { PrismaClient } from '@prisma/client';
import { createWorkerPayout, getWorkerPayoutsSummary } from '../controllers/admin.controller.js';
import { getWorkerEarnings } from '../controllers/worker.controller.js';

const prisma = new PrismaClient();

async function run() {
  console.log("=== WORKER PAYROLL SETTLEMENT INTEGRATION TEST ===");

  // Create worker user
  const workerEmail = `worker.payout.${Date.now()}@example.com`;
  const workerUser = await prisma.user.create({
    data: {
      email: workerEmail,
      name: "Payout Test Worker",
      role: 'WORKER',
      isActive: true,
      workerProfile: { create: {} },
    },
    include: { workerProfile: true },
  });

  // Create admin user for acting in audit logs
  const adminEmail = `admin.payout.${Date.now()}@example.com`;
  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Payout Admin Tester",
      role: 'ADMIN',
      isActive: true,
    },
  });

  // Create customer user
  const customerEmail = `customer.payout.${Date.now()}@example.com`;
  const customerUser = await prisma.user.create({
    data: {
      email: customerEmail,
      name: "Payout Customer",
      role: 'CUSTOMER',
      isActive: true,
      customerProfile: { create: {} },
    },
  });

  // Create order and assignment
  console.log("\nStep 1: Creating order & assigning worker...");
  const order = await prisma.order.create({
    data: {
      customerId: customerUser.id,
      orderNumber: `BS-PAY-${Date.now().toString().slice(-5)}`,
      eventType: "Rigging Live Sound",
      eventDate: new Date(),
      endDate: new Date(),
      startTime: "10:00 AM",
      endTime: "10:00 PM",
      venueAddress: "Surat Exhibition Center",
      status: 'EVENT_COMPLETED', // event is completed, eligible for payout
      totalDays: 1,
    },
  });

  const assignment = await prisma.workerAssignment.create({
    data: {
      orderId: order.id,
      workerId: workerUser.workerProfile.id,
      assignedRole: 'FOH Engineer',
      status: 'ACCEPTED',
    },
  });

  console.log("✅ Step 1 Passed: Order & Accepted assignment created.");

  // Test 1: Settle payout (createWorkerPayout)
  console.log("\nStep 2: Testing createWorkerPayout controller...");
  const reqPayout = {
    params: { workerId: workerUser.id },
    user: { userId: adminUser.id },
    body: {
      baseAmount: 2500,
      bonusAmount: 500,
      payoutMode: 'UPI',
      orderId: order.id,
      transactionRef: 'TXN-PAY-MOCK-999',
      notes: 'Outstanding mix quality performance',
    },
  };

  let payoutResData = null;
  const resPayout = {
    status: (code) => {
      assert.strictEqual(code, 201, `Expected 201, got ${code}`);
      return resPayout;
    },
    json: (data) => {
      payoutResData = data;
      return resPayout;
    },
  };

  await createWorkerPayout(reqPayout, resPayout);
  assert.ok(payoutResData.success);
  assert.strictEqual(payoutResData.data.totalAmount, 3000);
  assert.strictEqual(payoutResData.data.payoutMode, 'UPI');
  console.log("✅ Step 2 Passed: Payout settled successfully.");

  // Test 2: Verify payouts summary (getWorkerPayoutsSummary)
  console.log("\nStep 3: Testing getWorkerPayoutsSummary controller...");
  const reqSummary = {};
  let summaryResData = null;
  const resSummary = {
    status: (code) => {
      return resSummary;
    },
    json: (data) => {
      summaryResData = data;
      return resSummary;
    },
  };

  await getWorkerPayoutsSummary(reqSummary, resSummary);
  assert.ok(summaryResData.success);
  assert.ok(summaryResData.data.totalPaid >= 3000);
  console.log("✅ Step 3 Passed: Global summary returned correct paid aggregations.");

  // Test 3: Verify worker lifetime earnings dashboard payload (getWorkerEarnings)
  console.log("\nStep 4: Testing getWorkerEarnings controller...");
  const reqWorkerEarnings = {
    user: { userId: workerUser.id },
  };

  let earningsResData = null;
  const resWorkerEarnings = {
    status: (code) => {
      return resWorkerEarnings;
    },
    json: (data) => {
      earningsResData = data;
      return resWorkerEarnings;
    },
  };

  await getWorkerEarnings(reqWorkerEarnings, resWorkerEarnings);
  assert.ok(earningsResData.success);
  assert.strictEqual(earningsResData.data.totalLifetimeEarnings, 3000);
  assert.strictEqual(earningsResData.data.payouts.length, 1);
  assert.strictEqual(earningsResData.data.payouts[0].payoutMode, 'UPI');
  assert.strictEqual(earningsResData.data.payouts[0].order.orderNumber, order.orderNumber);
  console.log("✅ Step 4 Passed: Worker passbook dashboard data perfectly constructed.");

  // Clean up
  console.log("\nStep 5: Cleaning up test records...");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await prisma.auditLog.deleteMany({
    where: {
      actorId: { in: [workerUser.id, adminUser.id, customerUser.id] },
    },
  });
  await prisma.workerPayout.deleteMany({ where: { workerId: workerUser.id } });
  await prisma.workerAssignment.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
  await prisma.customerProfile.delete({ where: { userId: customerUser.id } });
  await prisma.workerProfile.delete({ where: { userId: workerUser.id } });
  await prisma.user.deleteMany({
    where: {
      id: { in: [workerUser.id, adminUser.id, customerUser.id] },
    },
  });

  console.log("✅ Step 5 Passed: Clean up completed.");

  await prisma.$disconnect();
  console.log("\nALL WORKER PAYROLL TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

run().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
