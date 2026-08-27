import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to central configuration
const SETTINGS_PATH = path.resolve(__dirname, '../../../config/settings.json');

const round2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

export const KNOWN_SERVICE_BASE_RATES = {
  'Stage Lighting Package': 6000,
  'Line Array Sound System': 8000,
  'Sony FX3 Cinema Camera': 3500,
  'Live Streaming Unit': 5000,
  'LED Wall P3.9': 150,
};

/**
 * Single source of truth for resolving base unit rate and line item total safely.
 */
export const resolveItemBaseRateAndTotal = (item, defaultDays = 1) => {
  if (!item) return { baseRate: 0, total: 0, days: 1, qty: 1, isArea: false, area: 1 };
  const name = item.serviceName || item.name || item.title || '';
  const qty = Number(item.quantity) || 1;
  const days = Number(item.days || defaultDays) || 1;
  const isArea = Boolean(item.pricingType === 'AREA_BASED' || (item.widthFt && item.heightFt) || (item.width && item.height) || name.toUpperCase().includes('LED'));
  const width = Number(item.widthFt || item.width || (isArea ? 12 : 0));
  const height = Number(item.heightFt || item.height || (isArea ? 8 : 0));
  const area = isArea ? (width > 0 && height > 0 ? width * height : 96) : 1;

  let baseRate = 0;

  // 1. Exact catalog match check
  for (const [knownName, rate] of Object.entries(KNOWN_SERVICE_BASE_RATES)) {
    if (name.toLowerCase().includes(knownName.toLowerCase()) || knownName.toLowerCase().includes(name.toLowerCase())) {
      baseRate = rate;
      break;
    }
  }

  // 2. Derive base rate from raw stored rate if not in known map
  if (!baseRate) {
    const rawRate = Number(item.unitRate || item.baseRate || item.finalRate || item.estimatedRate || item.price || item.rate || 0);
    if (isArea) {
      if (rawRate > 1000) {
        baseRate = Math.round(rawRate / (area * days * qty));
      } else if (rawRate > 500) {
        baseRate = Math.round(rawRate / days);
      } else {
        baseRate = rawRate || 150;
      }
    } else {
      if (rawRate > 15000 && days > 1) {
        baseRate = Math.round(rawRate / (qty * days));
      } else {
        baseRate = rawRate;
      }
    }
  }

  const total = isArea
    ? round2(area * baseRate * days * qty)
    : round2(qty * baseRate * days);

  return {
    name,
    baseRate,
    total,
    days,
    qty,
    isArea,
    width,
    height,
    area,
  };
};

/**
 * Standardized line-item price evaluation function (Single Source of Truth)
 * @param {Object} item - Service or equipment item object
 * @param {number} defaultDays - Order duration days
 * @returns {number} 2-decimal rounded line item total
 */
export const computeLineItemPrice = (item, defaultDays = 1) => {
  return resolveItemBaseRateAndTotal(item, defaultDays).total;
};

export class PricingEngineService {
  static getSettings() {
    try {
      const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Error reading settings.json:', err);
      // Fallback defaults if file read fails
      return {
        pricingRules: {
          baseLedSqFtRate: 150.0,
          defaultSetupFee: 2000.0,
          defaultTransportRate: 50.0,
          taxPercentage: 18.0,
          advancePayPercentage: 30.0,
          defaultTechnicianHourlyRate: 500.0,
        },
      };
    }
  }

  /**
   * Resolves an order's grand total, advance-due amount, and remaining balance
   * from its latest quotation snapshot, falling back to a rough equipment-based estimate
   * when no quotation exists yet. Single source of truth for payment
   * controllers so tax/advance rule changes apply everywhere at once.
   */
  static resolveOrderFinancials(order) {
    const quotation = order?.quotations?.[0];
    const rules = this.getSettings().pricingRules;

    let totalAmount = quotation ? round2(quotation.totalAmount) : 0;
    let advanceAmount = quotation && quotation.advanceFee ? round2(quotation.advanceFee) : 0;

    if (!quotation || totalAmount === 0) {
      const daysMultiplier = Number(order?.totalDays) || 1;
      const equipmentSubtotal = round2(
        (order?.orderItems || []).reduce((sum, item) => {
          const rate = Number(item.finalRate || item.estimatedRate || 0);
          const qty = Number(item.quantity || 1);
          const days = Number(item.days || daysMultiplier) || 1;
          return sum + rate * qty * days;
        }, 0)
      );

      const areaSqFt = Number(order?.ledWidthFeet || 0) * Number(order?.ledHeightFeet || 0);
      const setupFee = equipmentSubtotal > 0 ? (areaSqFt > 0 ? rules.defaultSetupFee : 500.0) : 0;
      const transportFee = order?.distanceKm ? Number(order.distanceKm) * rules.defaultTransportRate : 0;
      const technicianFee = 0;

      const subtotal = round2(equipmentSubtotal + setupFee + transportFee + technicianFee);
      const taxableAmount = Math.max(0, subtotal);
      const taxAmount = round2((taxableAmount * rules.taxPercentage) / 100);
      totalAmount = round2(taxableAmount + taxAmount);
      advanceAmount = round2((totalAmount * rules.advancePayPercentage) / 100);
    } else if (advanceAmount === 0 && totalAmount > 0) {
      advanceAmount = round2((totalAmount * rules.advancePayPercentage) / 100);
    }

    const remainingAmount = round2(totalAmount - advanceAmount);

    return { totalAmount, advanceAmount, remainingAmount };
  }

  /**
   * Server-side dynamic pricing calculation
   */
  static calculateQuotation({
    widthFeet = 0,
    heightFeet = 0,
    technicianHours = 0,
    transportDistanceKm = 0,
    customItems = [],
    adminDiscount = 0,
    discountType = 'FIXED',
    discountVal = null,
    customTaxRate = null,
    ledBaseRate = null,
    setupFeeOverride = null,
    transportFeeOverride = null,
    technicianFeeOverride = null,
    totalDays = 1,
  }) {
    const config = this.getSettings();
    const rules = config.pricingRules;
    const daysMultiplier = Math.max(1, Number(totalDays) || 1);

    const areaSqFt = Number(widthFeet) * Number(heightFeet);
    const effectiveLedRate = ledBaseRate !== null && ledBaseRate !== undefined ? Number(ledBaseRate) : rules.baseLedSqFtRate;
    const ledBaseCost = round2(areaSqFt * effectiveLedRate * daysMultiplier);

    const customItemsTotal = round2(
      customItems.reduce(
        (acc, item) =>
          acc +
          (Number(item.price || item.unitRate || item.baseRate || item.estimatedRate || item.finalRate) || 0) *
            (Number(item.quantity) || 1) *
            (Number(item.days) || daysMultiplier),
        0
      )
    );

    const hasAnyItemsOrDisplay = areaSqFt > 0 || customItemsTotal > 0;

    const setupFee = setupFeeOverride !== null && setupFeeOverride !== undefined
      ? round2(setupFeeOverride)
      : (hasAnyItemsOrDisplay ? (areaSqFt > 0 ? rules.defaultSetupFee : 500.0) : 0);

    const transportFee = transportFeeOverride !== null && transportFeeOverride !== undefined
      ? round2(transportFeeOverride)
      : (hasAnyItemsOrDisplay ? Number(transportDistanceKm) * rules.defaultTransportRate : 0);

    const technicianFee = technicianFeeOverride !== null && technicianFeeOverride !== undefined
      ? round2(technicianFeeOverride)
      : (hasAnyItemsOrDisplay ? Number(technicianHours) * rules.defaultTechnicianHourlyRate : 0);

    const servicesSubtotal = round2(ledBaseCost + customItemsTotal);
    const grossTotal = round2(servicesSubtotal + setupFee + transportFee + technicianFee);

    // Calculate discount amount
    const rawDiscount = discountVal !== null && discountVal !== undefined ? Number(discountVal) : Number(adminDiscount);
    const discountAmount = discountType === 'PERCENT'
      ? round2(servicesSubtotal * (rawDiscount / 100))
      : round2(rawDiscount || 0);

    const taxableAmount = Math.max(0, round2(grossTotal - discountAmount));
    const taxRate = customTaxRate !== null && customTaxRate !== undefined ? Number(customTaxRate) : rules.taxPercentage;
    const taxAmount = round2((taxableAmount * taxRate) / 100);
    const grandTotal = round2(taxableAmount + taxAmount);
    const advanceRequired = round2((grandTotal * rules.advancePayPercentage) / 100);
    const remainingRequired = round2(grandTotal - advanceRequired);

    return {
      areaSqFt,
      ratesUsed: {
        baseLedSqFtRate: effectiveLedRate,
        setupFee,
        transportRate: rules.defaultTransportRate,
        technicianHourlyRate: rules.defaultTechnicianHourlyRate,
        taxPercentage: taxRate,
        advancePayPercentage: rules.advancePayPercentage,
      },
      itemizedBreakdown: {
        ledBaseCost,
        setupFee,
        transportFee,
        technicianFee,
        customItemsTotal,
        discountAmount,
        adminDiscount: discountAmount,
      },
      financialSummary: {
        servicesSubtotal,
        setupFeeTotal: setupFee,
        transportFee,
        technicianFee,
        grossTotal,
        subtotal: grossTotal,
        discountAmount,
        taxableAmount,
        taxPercentage: taxRate,
        taxAmount,
        grandTotal,
        advanceRequired,
        remainingRequired,
      },
    };
  }
}
