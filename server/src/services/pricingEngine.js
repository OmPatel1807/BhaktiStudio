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
  }) {
    const config = this.getSettings();
    const rules = config.pricingRules;

    const areaSqFt = Number(widthFeet) * Number(heightFeet);
    const ledBaseCost = areaSqFt * rules.baseLedSqFtRate;

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
    const taxAmount = (taxableAmount * taxRate) / 100;
    const grandTotal = taxableAmount + taxAmount;
    const advanceRequired = (grandTotal * rules.advancePayPercentage) / 100;

    return {
      areaSqFt,
      ratesUsed: {
        baseLedSqFtRate: rules.baseLedSqFtRate,
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
