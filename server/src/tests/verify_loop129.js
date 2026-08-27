import { PrismaClient } from '@prisma/client';
import { sanitizeOrderFinancials } from '../controllers/order.controller.js';

const prisma = new PrismaClient();

async function runTest() {
  console.log('=== LOOP 129: FINANCIAL QUOTATION CALCULATION RE-SYNC & DATA SANITIZATION ENGINE TEST ===');

  console.log('Step 1: Constructing mock order with corrupt legacy subtotal values...');
  const mockOrder = {
    totalDays: 1,
    orderItems: [
      {
        estimatedRate: 15000,
        quantity: 2,
        days: 1,
      },
      {
        estimatedRate: 1900,
        quantity: 1,
        days: 1,
      }
    ],
    quotations: [
      {
        versionNumber: 1,
        subtotal: 1399900, // corrupt legacy subtotal
        setupFee: 3000,
        transportFee: 100,
        technicianFee: 2000,
        discounts: 0,
        taxAmount: 251982,
        totalAmount: 1657982,
        advanceFee: 497394,
      }
    ]
  };

  console.log('Step 2: Processing via sanitizeOrderFinancials...');
  const sanitized = sanitizeOrderFinancials(mockOrder);
  
  const expectedEquipmentSubtotal = (15000 * 2) + 1900; // 31900
  const expectedBase = expectedEquipmentSubtotal + 3000 + 100 + 2000; // 37000
  const expectedGst = Math.round(expectedBase * 0.18); // 6660
  const expectedGrandTotal = expectedBase + expectedGst; // 43660
  const expectedAdvance = Math.round(expectedGrandTotal * 0.30); // 13098

  const sanitizedQuotation = sanitized.quotations[0];
  console.log('Sanitized Quotation values:');
  console.log(' - Subtotal (Equipment):', sanitizedQuotation.subtotal);
  console.log(' - Setup Fee:', sanitizedQuotation.setupFee);
  console.log(' - Transport Fee:', sanitizedQuotation.transportFee);
  console.log(' - Technician Fee:', sanitizedQuotation.technicianFee);
  console.log(' - Tax Amount (GST):', sanitizedQuotation.taxAmount);
  console.log(' - Total Amount (Grand Total):', sanitizedQuotation.totalAmount);
  console.log(' - Advance Fee (Mandatory Booking Advance):', sanitizedQuotation.advanceFee);

  // Assertions
  if (sanitizedQuotation.subtotal !== expectedEquipmentSubtotal) {
    console.error(`❌ Expected subtotal to be ${expectedEquipmentSubtotal}, got ${sanitizedQuotation.subtotal}`);
    process.exit(1);
  }
  if (sanitizedQuotation.totalAmount !== expectedGrandTotal) {
    console.error(`❌ Expected totalAmount to be ${expectedGrandTotal}, got ${sanitizedQuotation.totalAmount}`);
    process.exit(1);
  }
  if (sanitizedQuotation.advanceFee !== expectedAdvance) {
    console.error(`❌ Expected advanceFee to be ${expectedAdvance}, got ${sanitizedQuotation.advanceFee}`);
    process.exit(1);
  }

  console.log('✅ Assertions passed!');
  console.log('\nALL LOOP 129 FINANCIAL SANITIZATION TESTS COMPLETED SUCCESSFULLY!');
  await prisma.$disconnect();
}

runTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
