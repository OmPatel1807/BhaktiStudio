import 'dotenv/config';
import { PricingEngineService } from '../services/pricingEngine.js';

function runFinancialAuditTests() {
  console.log('================================================================');
  console.log('  LOOP 76: ZERO-ERROR FINANCIAL AUDIT & RECONCILIATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, expected, actual) {
    if (condition) {
      console.log(`  ✅ PASS: ${message} (Value: ${actual})`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message} | Expected: ${expected}, Got: ${actual}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // CASE 1: Standard Calculation Pipeline
  // Subtotal ₹31,900, Setup ₹2,000, Transport ₹2,500 ➔ Taxable ₹36,400 ➔ GST (18%) ₹6,552 ➔ Grand Total ₹42,952
  // ---------------------------------------------------------------------------
  console.log('--- CASE 1: Standard Calculation Pipeline ---');
  const case1 = PricingEngineService.calculateQuotation({
    widthFeet: 0,
    heightFeet: 0,
    technicianHours: 0,
    transportDistanceKm: 50, // 50km * 50 = 2500 transport fee
    customItems: [{ price: 31900, quantity: 1 }], // Subtotal 31900
    setupFeeOverride: 2000,
    adminDiscount: 0,
    customTaxRate: 18,
  });

  const summary1 = case1.financialSummary;
  assert(summary1.servicesSubtotal === 31900, 'Subtotal equals ₹31,900', 31900, summary1.servicesSubtotal);
  assert(summary1.setupFeeTotal === 2000, 'Setup Fee equals ₹2,000', 2000, summary1.setupFeeTotal);
  assert(summary1.transportFee === 2500, 'Transport Fee equals ₹2,500', 2500, summary1.transportFee);
  assert(summary1.taxableAmount === 36400, 'Taxable Amount equals ₹36,400', 36400, summary1.taxableAmount);
  assert(summary1.taxAmount === 6552, 'GST 18% Tax Amount equals ₹6,552', 6552, summary1.taxAmount);
  assert(summary1.grandTotal === 42952, 'Grand Total equals ₹42,952', 42952, summary1.grandTotal);
  console.log('');

  // ---------------------------------------------------------------------------
  // CASE 2: Discount Pipeline (Percent Discount)
  // Subtotal ₹50,000, Discount 10% (₹5,000), Setup ₹0, Transport ₹0 ➔ Taxable ₹45,000 ➔ GST (18%) ₹8,100 ➔ Grand Total ₹53,100
  // ---------------------------------------------------------------------------
  console.log('--- CASE 2: 10% Discount Pipeline ---');
  const case2 = PricingEngineService.calculateQuotation({
    widthFeet: 0,
    heightFeet: 0,
    technicianHours: 0,
    transportDistanceKm: 0,
    customItems: [{ price: 50000, quantity: 1 }],
    setupFeeOverride: 0,
    transportFeeOverride: 0,
    discountType: 'PERCENT',
    discountVal: 10,
    customTaxRate: 18,
  });

  const summary2 = case2.financialSummary;
  assert(summary2.servicesSubtotal === 50000, 'Subtotal equals ₹50,000', 50000, summary2.servicesSubtotal);
  assert(summary2.discountAmount === 5000, '10% Discount Amount equals ₹5,000', 5000, summary2.discountAmount);
  assert(summary2.taxableAmount === 45000, 'Taxable Amount equals ₹45,000', 45000, summary2.taxableAmount);
  assert(summary2.taxAmount === 8100, 'GST 18% Tax Amount equals ₹8,100', 8100, summary2.taxAmount);
  assert(summary2.grandTotal === 53100, 'Grand Total equals ₹53,100', 53100, summary2.grandTotal);
  console.log('');

  // ---------------------------------------------------------------------------
  // CASE 3: Booking Advance & Remaining Balance Split Reconciliation
  // Grand Total ₹53,100 ➔ 30% Advance = ₹15,930.00, Remaining = ₹37,170.00. Sum = ₹53,100.00
  // ---------------------------------------------------------------------------
  console.log('--- CASE 3: 30% Advance & Remaining Split Reconciliation ---');
  const advance3 = summary2.advanceRequired;
  const remaining3 = summary2.remainingRequired;
  const splitSum3 = Math.round((advance3 + remaining3) * 100) / 100;

  assert(advance3 === 15930, '30% Advance equals ₹15,930.00', 15930, advance3);
  assert(remaining3 === 37170, 'Remaining Balance equals ₹37,170.00', 37170, remaining3);
  assert(splitSum3 === 53100, 'Advance + Remaining equals Grand Total ₹53,100.00', 53100, splitSum3);
  console.log('');

  // ---------------------------------------------------------------------------
  // CASE 4: Fractional Paisa Precision Edge Case
  // Verifies zero floating-point rounding errors on fractional inputs
  // ---------------------------------------------------------------------------
  console.log('--- CASE 4: Fractional Paisa Precision & Split Reconciliation ---');
  const case4 = PricingEngineService.calculateQuotation({
    widthFeet: 0,
    heightFeet: 0,
    technicianHours: 0,
    transportDistanceKm: 0,
    customItems: [{ price: 33333.33, quantity: 1 }],
    setupFeeOverride: 1111.11,
    transportFeeOverride: 0,
    adminDiscount: 0,
    customTaxRate: 18,
  });

  const summary4 = case4.financialSummary;
  const taxable4 = summary4.taxableAmount; // 34444.44
  const tax4 = summary4.taxAmount; // 6200.00
  const grandTotal4 = summary4.grandTotal; // 40644.44
  const advance4 = summary4.advanceRequired; // 12193.33
  const remaining4 = summary4.remainingRequired; // 28451.11
  const splitSum4 = Math.round((advance4 + remaining4) * 100) / 100;

  assert(taxable4 === 34444.44, 'Fractional Taxable equals ₹34,444.44', 34444.44, taxable4);
  assert(tax4 === 6200, 'Fractional Tax Amount equals ₹6,200.00', 6200, tax4);
  assert(grandTotal4 === 40644.44, 'Fractional Grand Total equals ₹40,644.44', 40644.44, grandTotal4);
  assert(splitSum4 === grandTotal4, 'Advance + Remaining sum equals Grand Total exactly', grandTotal4, splitSum4);
  console.log('');

  // ---------------------------------------------------------------------------
  // SUMMARY REPORT
  // ---------------------------------------------------------------------------
  console.log('================================================================');
  console.log(`  FINANCIAL AUDIT RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFinancialAuditTests();
