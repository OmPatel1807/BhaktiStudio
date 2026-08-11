import settings from '../../../config/settings.json';

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
  customDiscount = 0
}) => {
  const rules = settings.pricingRules;
  const areaSqFt = ledWidthFeet * ledHeightFeet;
  const ledBaseCost = areaSqFt * rules.baseLedSqFtRate;
  
  const setupFee = areaSqFt > 0 ? rules.defaultSetupFee : 0;
  const transportFee = transportDistanceKm * rules.defaultTransportRate;
  const technicianFee = technicianHours * rules.defaultTechnicianHourlyRate;

  const customItemsTotal = customItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

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
