import { PrismaClient } from '@prisma/client';
import { sanitizeOrderFinancials } from '../controllers/order.controller.js';

const prisma = new PrismaClient();

async function runTest() {
  console.log('=== LOOP 131: MULTI-DAY EVENT TRANSPARENCY & LINE-ITEM BREAKDOWN TEST ===');

  console.log('Step 1: Testing multi-day order financials sanitization...');
  const multiDayOrder = {
    eventType: 'Mahotsav Celebration',
    startDate: new Date('2026-09-21'),
    endDate: new Date('2026-09-23'),
    durationDays: 3,
    totalDays: 3,
    orderItems: [
      {
        serviceName: 'Line Array Sound System',
        quantity: 2,
        estimatedRate: 8000, // 8000 * 2 * 3 = 48,000
      },
      {
        serviceName: 'LED Wall P3.9',
        widthFt: 12,
        heightFt: 8, // 96 sq ft
        estimatedRate: 150, // 96 * 150 * 3 = 43,200
      }
    ],
    quotations: [
      {
        versionNumber: 1,
        subtotal: 999999, // Corrupt legacy subtotal to test sanitization
        setupFee: 3000,
        transportFee: 100,
        technicianFee: 2000,
        discounts: 0,
      }
    ]
  };

  const sanitized = sanitizeOrderFinancials(multiDayOrder);
  const q = sanitized.quotations[0];

  const expectedEquipment = (8000 * 2 * 3) + (96 * 150 * 3); // 48000 + 43200 = 91200
  const expectedBase = expectedEquipment + 3000 + 100 + 2000; // 96300
  const expectedTax = Math.round(expectedBase * 0.18); // 17334
  const expectedTotal = expectedBase + expectedTax; // 113634
  const expectedAdvance = Math.round(expectedTotal * 0.30); // 34090

  console.log('Calculated Financials:');
  console.log(' - Equipment Subtotal:', q.subtotal, 'Expected:', expectedEquipment);
  console.log(' - Total Amount:', q.totalAmount, 'Expected:', expectedTotal);
  console.log(' - Advance Fee:', q.advanceFee, 'Expected:', expectedAdvance);

  if (q.subtotal !== expectedEquipment) {
    console.error(`❌ Subtotal mismatch: expected ${expectedEquipment}, got ${q.subtotal}`);
    process.exit(1);
  }
  if (q.totalAmount !== expectedTotal) {
    console.error(`❌ Total amount mismatch: expected ${expectedTotal}, got ${q.totalAmount}`);
    process.exit(1);
  }
  if (q.advanceFee !== expectedAdvance) {
    console.error(`❌ Advance fee mismatch: expected ${expectedAdvance}, got ${q.advanceFee}`);
    process.exit(1);
  }

  console.log('✅ Assertions passed!');
  console.log('\nALL LOOP 131 MULTI-DAY TESTS COMPLETED SUCCESSFULLY!');
  await prisma.$disconnect();
}

runTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
