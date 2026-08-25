import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import assert from 'assert';
import { PrismaClient } from '@prisma/client';
import { uploadExecutionMedia, getWorkerMyOrders } from '../controllers/worker.controller.js';
import { getOrderById } from '../controllers/order.controller.js';

const prisma = new PrismaClient();

async function run() {
  console.log("=== EXECUTION MEDIA INTEGRATION TEST ===");

  // Create worker user
  const workerEmail = `worker.execution.${Date.now()}@example.com`;
  const workerUser = await prisma.user.create({
    data: {
      email: workerEmail,
      name: "Verification Worker",
      role: 'WORKER',
      isActive: true,
      workerProfile: { create: {} },
    },
    include: { workerProfile: true },
  });

  // Create customer user
  const customerEmail = `customer.execution.${Date.now()}@example.com`;
  const customerUser = await prisma.user.create({
    data: {
      email: customerEmail,
      name: "Execution Customer",
      role: 'CUSTOMER',
      isActive: true,
      customerProfile: { create: {} },
    },
  });

  // Create order
  console.log("\nStep 1: Creating order...");
  const order = await prisma.order.create({
    data: {
      customerId: customerUser.id,
      orderNumber: `BS-EXEC-${Date.now().toString().slice(-5)}`,
      eventType: "LED Stage Setup",
      eventDate: new Date(),
      endDate: new Date(),
      startTime: "10:00 AM",
      endTime: "10:00 PM",
      venueAddress: "Test Venue Surat",
      status: 'CONFIRMED',
      totalDays: 1,
    },
  });

  assert.strictEqual(order.status, 'CONFIRMED');
  console.log("✅ Step 1 Passed: Order created successfully.");

  // Create assignment to link the worker to the order
  console.log("\nStep 2: Assigning worker to the order...");
  const assignment = await prisma.workerAssignment.create({
    data: {
      orderId: order.id,
      workerId: workerUser.workerProfile.id,
      assignedRole: 'Lead Rigging Technician',
      status: 'ACCEPTED',
    },
  });
  console.log("✅ Step 2 Passed: Worker assigned & status set to ACCEPTED.");

  // Test worker upload-media controller endpoint
  console.log("\nStep 3: Simulating BEFORE_SETUP photo upload...");
  const reqUploadBefore = {
    params: { orderId: order.id },
    user: { userId: workerUser.id },
    body: {
      mediaType: 'BEFORE_SETUP',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // mock base64
      fileName: 'before_rigging.png',
    },
  };

  let uploadBeforeRes = null;
  const resUploadBefore = {
    status: (code) => {
      assert.strictEqual(code, 201, `Expected 201, got ${code}`);
      return resUploadBefore;
    },
    json: (data) => {
      uploadBeforeRes = data;
      return resUploadBefore;
    },
  };

  await uploadExecutionMedia(reqUploadBefore, resUploadBefore);
  assert.ok(uploadBeforeRes.success);
  assert.strictEqual(uploadBeforeRes.data.mediaType, 'BEFORE_SETUP');
  console.log("✅ Step 3 Passed: BEFORE_SETUP media uploaded.");

  // Test worker upload-media controller endpoint for AFTER_SETUP
  console.log("\nStep 4: Simulating AFTER_SETUP photo upload...");
  const reqUploadAfter = {
    params: { orderId: order.id },
    user: { userId: workerUser.id },
    body: {
      mediaType: 'AFTER_SETUP',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // mock base64
      fileName: 'after_stage_running.png',
    },
  };

  let uploadAfterRes = null;
  const resUploadAfter = {
    status: (code) => {
      assert.strictEqual(code, 201, `Expected 201, got ${code}`);
      return resUploadAfter;
    },
    json: (data) => {
      uploadAfterRes = data;
      return resUploadAfter;
    },
  };

  await uploadExecutionMedia(reqUploadAfter, resUploadAfter);
  assert.ok(uploadAfterRes.success);
  assert.strictEqual(uploadAfterRes.data.mediaType, 'AFTER_SETUP');
  console.log("✅ Step 4 Passed: AFTER_SETUP media uploaded.");

  // Test getOrderById fetches the uploaded media correctly
  console.log("\nStep 5: Verifying media exists in order retrieval query...");
  const reqGetOrder = {
    params: { id: order.id },
  };

  let getOrderRes = null;
  const resGetOrder = {
    status: (code) => {
      assert.strictEqual(code, 200);
      return resGetOrder;
    },
    json: (data) => {
      getOrderRes = data;
      return resGetOrder;
    },
  };

  await getOrderById(reqGetOrder, resGetOrder);
  assert.ok(getOrderRes.success);
  assert.ok(getOrderRes.data.executionMedia);
  assert.strictEqual(getOrderRes.data.executionMedia.length, 2);
  assert.strictEqual(getOrderRes.data.executionMedia[0].worker.name, "Verification Worker");
  console.log("✅ Step 5 Passed: Media relation mapped and returned properly.");

  // Clean up records
  console.log("\nStep 6: Cleaning up test records...");
  await new Promise((resolve) => setTimeout(resolve, 1500)); // wait for notifications

  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { orderId: order.id },
        { actorId: workerUser.id },
      ],
    },
  });
  await prisma.executionMedia.deleteMany({ where: { orderId: order.id } });
  await prisma.workerAssignment.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
  await prisma.customerProfile.delete({ where: { userId: customerUser.id } });
  await prisma.workerProfile.delete({ where: { userId: workerUser.id } });
  await prisma.user.deleteMany({
    where: {
      id: { in: [workerUser.id, customerUser.id] },
    },
  });
  console.log("✅ Step 6 Passed: Clean up completed.");

  await prisma.$disconnect();
  console.log("\nALL EXECUTION MEDIA TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

run().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
