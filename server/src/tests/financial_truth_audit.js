import { resolveItemBaseRateAndTotal, KNOWN_SERVICE_BASE_RATES } from '../services/pricingEngine.js';
import { sanitizeOrderFinancials } from '../controllers/order.controller.js';

function runFinancialTruthAudit() {
  console.log('=== FINANCIAL TRUTH AUDIT: SCREENSHOT ORDER #BS-2026-00014 REPRO & FIX ===\n');

  // Exact order from screenshot
  const order00014 = {
    orderNumber: 'BS-2026-00014',
    eventType: 'Wedding / Reception',
    durationDays: 3,
    totalDays: 3,
    distanceKm: 24,
    ledWidthFeet: 12,
    ledHeightFeet: 8,
    orderItems: [
      {
        serviceName: 'Stage Lighting Package',
        quantity: 2,
        estimatedRate: 36000, // Legacy corrupted stored rate in DB
      },
      {
        serviceName: 'Line Array Sound System',
        quantity: 2,
        estimatedRate: 48000, // Legacy corrupted stored rate in DB
      },
      {
        serviceName: 'Sony FX3 Cinema Camera',
        quantity: 4,
        estimatedRate: 42000, // Legacy corrupted stored rate in DB
      },
      {
        serviceName: 'LED Wall P3.9',
        widthFt: 12,
        heightFt: 8,
        quantity: 1,
        estimatedRate: 43200, // Legacy corrupted stored rate in DB
      }
    ],
    quotations: [
      {
        versionNumber: 1,
        setupFee: 2000,
        transportFee: 1200,
        technicianFee: 0,
        discounts: 0,
      }
    ]
  };

  console.log('Resolving Individual Line Items:');
  const resolvedItems = order00014.orderItems.map((item) => {
    const res = resolveItemBaseRateAndTotal(item, order00014.durationDays);
    console.log(` - ${res.name}:`);
    console.log(`   Base Rate: ₹${res.baseRate}/day | Qty: ${res.qty} | Days: ${res.days} | Total: ₹${res.total}`);
    return res;
  });

  const stageLighting = resolvedItems[0];
  const lineArray = resolvedItems[1];
  const camera = resolvedItems[2];
  const ledWall = resolvedItems[3];

  if (stageLighting.baseRate !== 6000 || stageLighting.total !== 36000) {
    console.error(`❌ Stage Lighting incorrect: baseRate=${stageLighting.baseRate}, total=${stageLighting.total}`);
    process.exit(1);
  }
  if (lineArray.baseRate !== 8000 || lineArray.total !== 48000) {
    console.error(`❌ Line Array incorrect: baseRate=${lineArray.baseRate}, total=${lineArray.total}`);
    process.exit(1);
  }
  if (camera.baseRate !== 3500 || camera.total !== 42000) {
    console.error(`❌ Sony FX3 Camera incorrect: baseRate=${camera.baseRate}, total=${camera.total}`);
    process.exit(1);
  }
  if (ledWall.baseRate !== 150 || ledWall.total !== 43200) {
    console.error(`❌ LED Wall incorrect: baseRate=${ledWall.baseRate}, total=${ledWall.total}`);
    process.exit(1);
  }

  console.log('\nProcessing Order via sanitizeOrderFinancials...');
  const sanitized = sanitizeOrderFinancials(order00014);
  const q = sanitized.quotations[0];

  console.log('Sanitized Quotation Summary:');
  console.log(` - Equipment Subtotal: ₹${q.subtotal} (Expected: ₹169200)`);
  console.log(` - Setup & Rigging: +₹${q.setupFee}`);
  console.log(` - Transport (24 km): +₹${q.transportFee}`);
  console.log(` - GST (18%): ₹${q.taxAmount} (Expected: ₹31032)`);
  console.log(` - Grand Total: ₹${q.totalAmount} (Expected: ₹203432)`);
  console.log(` - 30% Advance: ₹${q.advanceFee} (Expected: ₹61030)`);

  if (q.subtotal !== 169200) {
    console.error(`❌ Subtotal mismatch: expected 169200, got ${q.subtotal}`);
    process.exit(1);
  }
  if (q.totalAmount !== 203432) {
    console.error(`❌ Grand total mismatch: expected 203432, got ${q.totalAmount}`);
    process.exit(1);
  }
  if (q.advanceFee !== 61030) {
    console.error(`❌ Advance fee mismatch: expected 61030, got ${q.advanceFee}`);
    process.exit(1);
  }

  console.log('\n--- TESTING ADMIN QUOTATION (V2) WHERE QUANTITY WAS ERRONEOUSLY STORED AS 96 ---');
  const orderWithCorruptedQuantity = {
    ...order00014,
    orderItems: [
      { serviceName: 'Stage Lighting Package', quantity: 2, estimatedRate: 6000 },
      { serviceName: 'Line Array Sound System', quantity: 2, estimatedRate: 8000 },
      { serviceName: 'Sony FX3 Cinema Camera', quantity: 4, estimatedRate: 3500 },
      { serviceName: 'LED Wall P3.9', widthFt: 12, heightFt: 8, quantity: 96, estimatedRate: 150 } // quantity was set to area (96)
    ],
    quotations: [
      {
        versionNumber: 2,
        setupFee: 4000,
        transportFee: 3000,
        technicianFee: 5000,
        discounts: 0,
      }
    ]
  };

  const sanitizedV2 = sanitizeOrderFinancials(orderWithCorruptedQuantity);
  const qV2 = sanitizedV2.quotations[0];
  console.log(` - V2 Equipment Subtotal: ₹${qV2.subtotal} (Expected: ₹169200)`);
  console.log(` - V2 Setup: +₹${qV2.setupFee}`);
  console.log(` - V2 Transport: +₹${qV2.transportFee}`);
  console.log(` - V2 Technician: +₹${qV2.technicianFee}`);
  console.log(` - V2 Grand Total: ₹${qV2.totalAmount} (Expected: ₹213816)`);

  if (qV2.subtotal !== 169200) {
    console.error(`❌ V2 Subtotal mismatch: expected 169200, got ${qV2.subtotal}`);
    process.exit(1);
  }
  if (qV2.totalAmount !== 213816) {
    console.error(`❌ V2 Grand total mismatch: expected 213816, got ${qV2.totalAmount}`);
    process.exit(1);
  }

  console.log('\n✅ ALL FINANCIAL TRUTH AUDIT ASSERTIONS (V1 & V2) PASSED WITH 100% MATHEMATICAL PRECISION!');
}

runFinancialTruthAudit();
