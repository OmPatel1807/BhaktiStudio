import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to central configuration
const SETTINGS_PATH = path.resolve(__dirname, '../../../config/settings.json');

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
   * Resolves an order's grand total and advance-due amount from its latest
   * quotation snapshot, falling back to a rough equipment-based estimate
   * when no quotation exists yet. Single source of truth for payment
   * controllers so tax/advance rule changes apply everywhere at once.
   */
  static resolveOrderFinancials(order) {
    const quotation = order.quotations?.[0];
    let totalAmount = quotation ? quotation.totalAmount : 0;
    let advanceAmount = quotation ? quotation.advanceFee : 0;

    if (!quotation || totalAmount === 0) {
      const rules = this.getSettings().pricingRules;
      const equipmentSubtotal = (order.orderItems || []).reduce((sum, item) => {
        const rate = Number(item.finalRate || item.estimatedRate || 0);
        const qty = Number(item.quantity || 1);
        return sum + rate * qty;
      }, 0);

      // Same setup-fee branching as calculateQuotation: full fee once an LED
      // wall is involved, flat no-display fee for equipment-only orders.
      const areaSqFt = Number(order.ledWidthFeet || 0) * Number(order.ledHeightFeet || 0);
      const setupFee = equipmentSubtotal > 0 ? (areaSqFt > 0 ? rules.defaultSetupFee : 500.0) : 0;
      const transportFee = order.distanceKm ? Number(order.distanceKm) * rules.defaultTransportRate : 0;
      // Technician hours aren't captured on the order prior to a formal quotation.
      const technicianFee = 0;

      const subtotal = equipmentSubtotal + setupFee + transportFee + technicianFee;
      totalAmount = subtotal + (subtotal * rules.taxPercentage) / 100;
      advanceAmount = (totalAmount * rules.advancePayPercentage) / 100;
    }

    return { totalAmount, advanceAmount };
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
    customTaxRate = null,
    ledBaseRate = null,
  }) {
    const config = this.getSettings();
    const rules = config.pricingRules;

    const areaSqFt = Number(widthFeet) * Number(heightFeet);
    const effectiveLedRate = ledBaseRate !== null && ledBaseRate !== undefined ? Number(ledBaseRate) : rules.baseLedSqFtRate;
    const ledBaseCost = areaSqFt * effectiveLedRate;

    const customItemsTotal = customItems.reduce(
      (acc, item) => acc + (Number(item.price || item.unitRate || item.baseRate) || 0) * (Number(item.quantity) || 1),
      0
    );

    const hasAnyItemsOrDisplay = areaSqFt > 0 || customItemsTotal > 0;

    const setupFee = hasAnyItemsOrDisplay ? (areaSqFt > 0 ? rules.defaultSetupFee : 500.0) : 0;
    const transportFee = hasAnyItemsOrDisplay ? Number(transportDistanceKm) * rules.defaultTransportRate : 0;
    const technicianFee = hasAnyItemsOrDisplay ? Number(technicianHours) * rules.defaultTechnicianHourlyRate : 0;

    const servicesSubtotal = ledBaseCost + customItemsTotal;
    const subtotal = servicesSubtotal + setupFee + transportFee + technicianFee - Number(adminDiscount);
    const taxableAmount = Math.max(0, subtotal);
    const taxRate = customTaxRate !== null ? Number(customTaxRate) : rules.taxPercentage;
    const taxAmount = Math.round((taxableAmount * taxRate) / 100);
    const grandTotal = taxableAmount + taxAmount;
    const advanceRequired = Math.round((grandTotal * rules.advancePayPercentage) / 100);

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
        adminDiscount: Number(adminDiscount),
      },
      financialSummary: {
        servicesSubtotal,
        setupFeeTotal: setupFee,
        transportFee,
        technicianFee,
        subtotal,
        taxableAmount,
        taxPercentage: taxRate,
        taxAmount,
        grandTotal,
        advanceRequired,
      },
    };
  }
}
