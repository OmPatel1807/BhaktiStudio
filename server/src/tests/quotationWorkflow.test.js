import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import assert from 'assert';
import { PrismaClient } from '@prisma/client';
import { updateOrderQuotation } from '../controllers/admin.controller.js';

const prisma = new PrismaClient();

async function run() {
  console.log("=== QUOTATION WORKFLOW INTEGRATION TEST ===");

  // Create a customer user
  const customerEmail = `customer.workflow.${Date.now()}@example.com`;
  const customer = await prisma.user.create({
    data: {
      email: customerEmail,
      name: "Workflow Customer",
      role: 'CUSTOMER',
      isActive: true,
      customerProfile: { create: {} },
    },
  });

  // Create an admin user for audit log mapping
  const adminEmail = `admin.workflow.${Date.now()}@example.com`;
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Workflow Admin",
      role: 'ADMIN',
      isActive: true,
    },
  });

  // Create an order in SUBMITTED status
  console.log("\nStep 1: Creating a submitted order...");
  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      orderNumber: `BS-TEST-${Date.now().toString().slice(-5)}`,
      eventType: "LED Production",
      eventDate: new Date(),
      endDate: new Date(),
      startTime: "10:00 AM",
      endTime: "10:00 PM",
      venueAddress: "Surat Exhibition Center",
      status: 'SUBMITTED',
      totalDays: 2,
      orderItems: {
        create: [
          {
            serviceName: "P3 LED Screen",
            estimatedRate: 150.0,
            quantity: 100,
          },
        ],
      },
    },
    include: {
      orderItems: true,
    },
  });

  assert.strictEqual(order.status, 'SUBMITTED');
  assert.strictEqual(order.orderItems.length, 1);
  console.log("✅ Step 1 Passed: Order created in SUBMITTED status.");

  // Test Rejection action
  console.log("\nStep 2: Rejecting the order...");
  const reqReject = {
    params: { orderId: order.id },
    body: { action: 'REJECT' },
  };

  let rejectResData = null;
  const resReject = {
    status: (code) => {
      assert.strictEqual(code, 200, `Expected 200, got ${code}`);
      return resReject;
    },
    json: (data) => {
      rejectResData = data;
      return resReject;
    },
  };

  await updateOrderQuotation(reqReject, resReject);
  assert.ok(rejectResData.success);
  assert.strictEqual(rejectResData.order.status, 'REJECTED');
  console.log("✅ Step 2 Passed: Order successfully set to REJECTED.");

  // Reset status to SUBMITTED to test pricing/acceptance workflow
  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'SUBMITTED' },
  });

  // Test Acceptance & Pricing Quotation publication
  console.log("\nStep 3: Adjusting items and publishing quotation...");
  const orderItem = order.orderItems[0];
  const reqAccept = {
    params: { orderId: order.id },
    body: {
      action: 'ACCEPT_AND_QUOTE',
      setupFee: 3000,
      transportFee: 1500,
      technicianFee: 2000,
      discount: 1000,
      discountType: 'FIXED',
      gstRate: 18,
      notes: "Custom commercial terms applied",
      items: [
        {
          id: orderItem.id,
          finalRate: 140.0, // adjusted down from 150
          quantity: 100,
        },
      ],
    },
  };

  let acceptResData = null;
  const resAccept = {
    status: (code) => {
      assert.strictEqual(code, 200, `Expected 200, got ${code}`);
      return resAccept;
    },
    json: (data) => {
      acceptResData = data;
      return resAccept;
    },
  };

  await updateOrderQuotation(reqAccept, resAccept);
  assert.ok(acceptResData.success);
  assert.strictEqual(acceptResData.order.status, 'QUOTATION_SENT');

  // Verify DB entries for QuotationVersion
  const latestQuote = await prisma.quotationVersion.findFirst({
    where: { orderId: order.id },
    orderBy: { versionNumber: 'desc' },
  });

  assert.ok(latestQuote, "A QuotationVersion record must be created");
  assert.strictEqual(latestQuote.versionNumber, 1);
  assert.strictEqual(latestQuote.setupFee, 3000);
  assert.strictEqual(latestQuote.transportFee, 1500);
  assert.strictEqual(latestQuote.technicianFee, 2000);
  assert.strictEqual(latestQuote.discounts, 1000);

  // Subtotal = 140 * 100 * 2 = 28000 + 3000 + 1500 + 2000 = 34500
  assert.strictEqual(latestQuote.subtotal, 34500);
  // Taxable = 34500 - 1000 = 33500
  // Tax (18% of 33500) = 6030
  assert.strictEqual(latestQuote.taxAmount, 6030);
  // Total = 33500 + 6030 = 39530
  assert.strictEqual(latestQuote.totalAmount, 39530);

  console.log("✅ Step 3 Passed: Quotation successfully generated and verified.");

  // Clean up records
  console.log("\nStep 4: Cleaning up test records...");
  console.log("Test Customer ID:", customer.id);
  console.log("Test Admin ID:", admin.id);
  
  // Wait for async notification dispatches to complete
  await new Promise((resolve) => setTimeout(resolve, 1500));

  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { orderId: order.id },
        { actorId: customer.id },
        { actorId: admin.id }
      ]
    }
  });
  await prisma.quotationVersion.deleteMany({ where: { orderId: order.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
  await prisma.customerProfile.delete({ where: { userId: customer.id } });
  await prisma.user.delete({ where: { id: customer.id } });
  await prisma.user.delete({ where: { id: admin.id } });
  console.log("✅ Step 4 Passed: Clean up completed.");

  await prisma.$disconnect();
  console.log("\nALL TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

run().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
