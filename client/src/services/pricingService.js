import settings from '../../../config/settings.json';

/**
 * Single source of truth for the configurable pricing rules on the client.
 * Mirrors PricingEngineService.getSettings() on the server.
 */
export const getPricingRules = () => settings.pricingRules;

export const getAdvancePercentage = () => settings.pricingRules.advancePayPercentage;

export const getTaxPercentage = () => settings.pricingRules.taxPercentage;

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
  ledBaseRate = null,
}) => {
  const rules = settings.pricingRules;
  const areaSqFt = ledWidthFeet * ledHeightFeet;
  const effectiveLedRate = ledBaseRate !== null && ledBaseRate !== undefined ? Number(ledBaseRate) : rules.baseLedSqFtRate;
  const ledBaseCost = areaSqFt * effectiveLedRate;

  const customItemsTotal = customItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

  // Mirrors PricingEngineService.calculateQuotation's setup fee branching exactly:
  // no fee when the order has nothing at all, a flat no-display fee when there
  // are items but no LED wall, and the full setup fee once an LED wall is involved.
  const hasAnyItemsOrDisplay = areaSqFt > 0 || customItemsTotal > 0;
  const setupFee = hasAnyItemsOrDisplay ? (areaSqFt > 0 ? rules.defaultSetupFee : 500.0) : 0;
  const transportFee = hasAnyItemsOrDisplay ? transportDistanceKm * rules.defaultTransportRate : 0;
  const technicianFee = hasAnyItemsOrDisplay ? technicianHours * rules.defaultTechnicianHourlyRate : 0;

  const subtotal = ledBaseCost + setupFee + transportFee + technicianFee + customItemsTotal - customDiscount;
  const taxableAmount = Math.max(0, subtotal);
  const taxAmount = (taxableAmount * rules.taxPercentage) / 100;
  const grandTotal = taxableAmount + taxAmount;
  const advanceRequired = (grandTotal * rules.advancePayPercentage) / 100;

  return {
    areaSqFt,
    ledBaseCost,
    setupFee,
    transportFee,
    technicianFee,
    subtotal,
    taxPercentage: rules.taxPercentage,
    taxAmount,
    grandTotal,
    advancePayPercentage: rules.advancePayPercentage,
    advanceRequired,
  };
};
