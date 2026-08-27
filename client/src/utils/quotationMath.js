/**
 * LOOP 40: Unified Quotation Math Helper
 *
 * Single source of truth for resolving display totals across all frontend components.
 * Eliminates fragile stale-detection heuristics by trusting the DB quotation record
 * as the authoritative source once it exists.
 */

import { calculateEstimatedPricing, getAdvancePercentage, getTaxPercentage } from '../services/pricingService.js';

const round2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

export const KNOWN_SERVICE_BASE_RATES = {
  'Stage Lighting Package': 6000,
  'Line Array Sound System': 8000,
  'Sony FX3 Cinema Camera': 3500,
  'Live Streaming Unit': 5000,
  'LED Wall P3.9': 150,
};

export function resolveItemBaseRateAndTotal(item, defaultDays = 1) {
  if (!item) return { baseRate: 0, total: 0, days: 1, qty: 1, isArea: false, area: 1, width: 0, height: 0, name: '' };
  const name = item.serviceName || item.name || item.title || '';
  const qty = Number(item.quantity || item.qty || 1);
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

  // For Area-based (LED Wall):
  // If qty >= 20 (or qty === area), qty was stored as the sq ft area instead of number of LED screens.
  const screenQty = isArea ? (qty >= 20 || qty === area ? 1 : (qty || 1)) : (qty || 1);

  const total = isArea
    ? round2(area * baseRate * days * screenQty)
    : round2(qty * baseRate * days);

  return {
    name,
    baseRate,
    total,
    days,
    qty: screenQty,
    isArea,
    width,
    height,
    area,
  };
}

export function computeLineItemPrice(item, defaultDays = 1) {
  return resolveItemBaseRateAndTotal(item, defaultDays).total;
}

/**
 * Compute the equipment subtotal from order items.
 * @param {Array} orderItems - Array of order item objects
 * @param {number} durationDays - Total days of the event
 * @returns {number} Equipment subtotal
 */
export function computeEquipmentSubtotal(orderItems = [], durationDays = 1) {
  const days = Number(durationDays) || 1;
  return round2(
    orderItems.reduce((sum, item) => sum + computeLineItemPrice(item, item.days || days), 0)
  );
}

/**
 * Rehydrate a quotation record by recalculating derived fields from its stored fees
 * and the order's equipment items. This ensures that even if the DB record was saved
 * without equipment costs (pre-LOOP 40 bug), the display values are correct.
 *
 * @param {Object} quotation - The raw quotation record from the API
 * @param {Array} orderItems - The order's items array
 * @param {number} durationDays - Total days of the event
 * @returns {Object} Rehydrated quotation with corrected subtotal, taxAmount, totalAmount, advanceFee
 */
export function rehydrateQuotation(quotation, orderItems = [], durationDays = 1) {
  if (!quotation) return null;

  const days = Number(durationDays) || 1;
  const equipmentSubtotal = computeEquipmentSubtotal(orderItems, days);

  const setupFee = round2(quotation.setupFee || 0);
  const transportFee = round2(quotation.transportFee || 0);
  const technicianFee = round2(quotation.technicianFee || 0);
  const discounts = round2(quotation.discounts || 0);

  const additionalFeesTotal = round2(setupFee + transportFee + technicianFee);
  const grossSubtotal = round2(equipmentSubtotal + additionalFeesTotal);
  const taxableAmount = Math.max(0, round2(grossSubtotal - discounts));

  // Detect the GST rate: reverse-engineer from stored values, fallback to settings
  const storedSubtotal = round2(quotation.subtotal || 0);
  const storedTax = round2(quotation.taxAmount || 0);
  let gstRate = getTaxPercentage();
  if (storedSubtotal > 0 && storedTax > 0) {
    const inferredRate = (storedTax / storedSubtotal) * 100;
    if (inferredRate >= 1 && inferredRate <= 50) {
      gstRate = Math.round(inferredRate * 100) / 100;
    }
  }

  const taxAmount = round2((taxableAmount * gstRate) / 100);
  const totalAmount = round2(taxableAmount + taxAmount);
  const advanceFee = round2((totalAmount * getAdvancePercentage()) / 100);
  const remainingFee = round2(totalAmount - advanceFee);

  // Check if the stored values already match the calculated values
  const storedTotal = round2(quotation.totalAmount || 0);
  
  // Guard against legacy absurd values (> 10x computed equipment subtotal + overheads)
  const isAbsurd = equipmentSubtotal > 0 && (storedSubtotal > 10 * (equipmentSubtotal + additionalFeesTotal) || storedSubtotal < (equipmentSubtotal / 2));

  const isAlreadyCorrect =
    !isAbsurd &&
    Math.abs(storedTotal - totalAmount) < 0.01 &&
    Math.abs(storedSubtotal - grossSubtotal) < 0.01;

  if (isAlreadyCorrect) {
    // DB values are correct — return as-is to avoid floating point drift
    return {
      ...quotation,
      subtotal: storedSubtotal,
      totalAmount: storedTotal,
      advanceFee: quotation.advanceFee ? round2(quotation.advanceFee) : advanceFee,
      remainingFee: round2((quotation.totalAmount || totalAmount) - (quotation.advanceFee || advanceFee)),
    };
  }

  // DB values are stale or legacy absurd — return rehydrated version
  return {
    ...quotation,
    subtotal: grossSubtotal,
    taxAmount,
    totalAmount,
    advanceFee,
    remainingFee,
  };
}

/**
 * Resolve the display total for an order card.
 * Uses the latest quotation's totalAmount directly when available,
 * with rehydration to catch stale pre-LOOP 40 records.
 *
 * @param {Object} order - Full order object with quotations[] and orderItems[]
 * @returns {{ displayTotal: number, label: string, quotation: Object|null }}
 */
export function resolveOrderDisplayTotal(order) {
  if (!order) return { displayTotal: 0, label: 'Estimated Total', quotation: null };

  const durationDays = Number(order.durationDays || order.totalDays || 1);
  const rawQuotation = order.quotations?.[0];

  if (rawQuotation) {
    const rehydrated = rehydrateQuotation(rawQuotation, order.orderItems, durationDays);
    return {
      displayTotal: rehydrated.totalAmount,
      label: 'Quotation Total',
      quotation: rehydrated,
    };
  }

  // No quotation exists — compute a raw estimate using the same shared pricing
  // logic the server's /orders/estimate endpoint uses, so setup/transport/
  // technician fees are represented the same way here as everywhere else.
  const orderItems = order.orderItems || [];
  const equipmentSubtotal = computeEquipmentSubtotal(orderItems, durationDays);
  if (equipmentSubtotal === 0) {
    return { displayTotal: 0, label: 'Estimated Total', quotation: null };
  }

  // The LED item is the one order.controller.js stamped with widthFt/heightFt;
  // everything else is a flat-rate custom item.
  const ledItem = orderItems.find((item) => item.widthFt && item.heightFt);
  const customItems = orderItems
    .filter((item) => item !== ledItem)
    .map((item) => ({
      price: Number(item.finalRate || item.estimatedRate || 0),
      quantity: Number(item.quantity || 1),
      days: durationDays,
    }));

  const estimate = calculateEstimatedPricing({
    ledWidthFeet: Number(order.ledWidthFeet || 0),
    ledHeightFeet: Number(order.ledHeightFeet || 0),
    technicianHours: 0,
    transportDistanceKm: Number(order.distanceKm || 0),
    customItems,
    ledBaseRate: ledItem ? Number(ledItem.finalRate || ledItem.estimatedRate || 0) : null,
    totalDays: durationDays,
  });

  return { displayTotal: estimate.grandTotal, label: 'Estimated Total', quotation: null };
}
