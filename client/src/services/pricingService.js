import settings from '../../../config/settings.json';

/**
 * Single source of truth for the configurable pricing rules on the client.
 * Mirrors PricingEngineService.getSettings() on the server.
 */
export const getPricingRules = () => settings.pricingRules;

export const getAdvancePercentage = () => settings.pricingRules.advancePayPercentage;

export const getTaxPercentage = () => settings.pricingRules.taxPercentage;

const round2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

/**
 * Frontend pricing estimation helper (mirrors backend engine logic for instant UI responsiveness)
 * Admin final pricing is enforced on server side.
 */
export const calculateEstimatedPricing = ({
  ledWidthFeet = 0,
  ledHeightFeet = 0,
  technicianHours = 0,
  transportDistanceKm = 0,
  customItems = [],
  customDiscount = 0,
  discountType = 'FIXED',
  ledBaseRate = null,
}) => {
  const rules = settings.pricingRules;
  const areaSqFt = Number(ledWidthFeet || 0) * Number(ledHeightFeet || 0);
  const effectiveLedRate = ledBaseRate !== null && ledBaseRate !== undefined ? Number(ledBaseRate) : rules.baseLedSqFtRate;
  const ledBaseCost = round2(areaSqFt * effectiveLedRate);

  const customItemsTotal = round2(
    customItems.reduce(
      (sum, item) =>
        sum +
        (Number(item.price || item.unitRate || item.baseRate || item.estimatedRate || item.finalRate) || 0) *
          (Number(item.quantity) || 1) *
          (Number(item.days) || 1),
      0
    )
  );

  const hasAnyItemsOrDisplay = areaSqFt > 0 || customItemsTotal > 0;
  const setupFee = round2(hasAnyItemsOrDisplay ? (areaSqFt > 0 ? rules.defaultSetupFee : 500.0) : 0);
  const transportFee = round2(hasAnyItemsOrDisplay ? Number(transportDistanceKm) * rules.defaultTransportRate : 0);
  const technicianFee = round2(hasAnyItemsOrDisplay ? Number(technicianHours) * rules.defaultTechnicianHourlyRate : 0);

  const servicesSubtotal = round2(ledBaseCost + customItemsTotal);
  const grossSubtotal = round2(servicesSubtotal + setupFee + transportFee + technicianFee);

  const rawDiscount = Number(customDiscount || 0);
  const discountAmount = discountType === 'PERCENT'
    ? round2(servicesSubtotal * (rawDiscount / 100))
    : round2(rawDiscount);

  const taxableAmount = Math.max(0, round2(grossSubtotal - discountAmount));
  const taxAmount = round2((taxableAmount * rules.taxPercentage) / 100);
  const grandTotal = round2(taxableAmount + taxAmount);
  const advanceRequired = round2((grandTotal * rules.advancePayPercentage) / 100);
  const remainingRequired = round2(grandTotal - advanceRequired);

  return {
    areaSqFt,
    ledBaseCost,
    customItemsTotal,
    servicesSubtotal,
    setupFee,
    setupFeeTotal: setupFee,
    transportFee,
    technicianFee,
    grossSubtotal,
    subtotal: grossSubtotal,
    discountAmount,
    taxableAmount,
    taxPercentage: rules.taxPercentage,
    taxAmount,
    grandTotal,
    advancePayPercentage: rules.advancePayPercentage,
    advanceRequired,
    remainingRequired,
  };
};
