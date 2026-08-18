/**
 * LOOP 40: Unified Quotation Math Helper
 *
 * Single source of truth for resolving display totals across all frontend components.
 * Eliminates fragile stale-detection heuristics by trusting the DB quotation record
 * as the authoritative source once it exists.
 */

import { calculateEstimatedPricing, getAdvancePercentage, getTaxPercentage } from '../services/pricingService';

const round2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

export function computeLineItemPrice(item) {
  if (!item) return 0;
  const unitRate = Number(item.unitRate || item.baseRate || item.price || item.estimatedRate || item.finalRate || 0);
  const days = Number(item.days) || 1;
  const qty = Number(item.quantity) || 1;
  const width = Number(item.width || item.widthFt || 0);
  const height = Number(item.height || item.heightFt || 0);

  if (width > 0 && height > 0) {
    const area = width * height;
    const isTotalRate = unitRate > 500 && area > 1;
    const itemTotal = isTotalRate ? unitRate : (unitRate * area);
    return round2(itemTotal * days * qty);
  }
  return round2(unitRate * qty * days);
}

/**
 * Compute the equipment subtotal from order items.
 * @param {Array} orderItems - Array of order item objects
 * @returns {number} Equipment subtotal
 */
export function computeEquipmentSubtotal(orderItems = []) {
  return round2(
    orderItems.reduce((sum, item) => sum + computeLineItemPrice(item), 0)
  );
}

/**
 * Rehydrate a quotation record by recalculating derived fields from its stored fees
 * and the order's equipment items. This ensures that even if the DB record was saved
 * without equipment costs (pre-LOOP 40 bug), the display values are correct.
 *
 * @param {Object} quotation - The raw quotation record from the API
 * @param {Array} orderItems - The order's items array
 * @returns {Object} Rehydrated quotation with corrected subtotal, taxAmount, totalAmount, advanceFee
 */
export function rehydrateQuotation(quotation, orderItems = []) {
  if (!quotation) return null;

  const equipmentSubtotal = computeEquipmentSubtotal(orderItems);

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
  const isAlreadyCorrect =
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

  // DB values are stale — return rehydrated version
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

  const rawQuotation = order.quotations?.[0];

  if (rawQuotation) {
    const rehydrated = rehydrateQuotation(rawQuotation, order.orderItems);
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
  const equipmentSubtotal = computeEquipmentSubtotal(orderItems);
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
    }));

  const estimate = calculateEstimatedPricing({
    ledWidthFeet: Number(order.ledWidthFeet || 0),
    ledHeightFeet: Number(order.ledHeightFeet || 0),
    technicianHours: 0,
    transportDistanceKm: Number(order.distanceKm || 0),
    customItems,
    ledBaseRate: ledItem ? Number(ledItem.finalRate || ledItem.estimatedRate || 0) : null,
  });

  return { displayTotal: estimate.grandTotal, label: 'Estimated Total', quotation: null };
}
