/**
 * LOOP 40: Unified Quotation Math Helper
 *
 * Single source of truth for resolving display totals across all frontend components.
 * Eliminates fragile stale-detection heuristics by trusting the DB quotation record
 * as the authoritative source once it exists.
 */

import { calculateEstimatedPricing, getAdvancePercentage, getTaxPercentage } from '../services/pricingService';

/**
 * Compute the equipment subtotal from order items.
 * @param {Array} orderItems - Array of order item objects
 * @returns {number} Equipment subtotal
 */
export function computeEquipmentSubtotal(orderItems = []) {
  return orderItems.reduce((sum, item) => {
    const rate = Number(item.finalRate || item.estimatedRate || 0);
    const qty = Number(item.quantity || 1);
    return sum + rate * qty;
  }, 0);
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

  const setupFee = Number(quotation.setupFee || 0);
  const transportFee = Number(quotation.transportFee || 0);
  const technicianFee = Number(quotation.technicianFee || 0);
  const discounts = Number(quotation.discounts || 0);

  const additionalFeesTotal = setupFee + transportFee + technicianFee;
  const netSubtotal = equipmentSubtotal + additionalFeesTotal - discounts;
  const taxableAmount = Math.max(0, netSubtotal);

  // Detect the GST rate: reverse-engineer from stored values, fallback to settings
  const storedSubtotal = Number(quotation.subtotal || 0);
  const storedTax = Number(quotation.taxAmount || 0);
  let gstRate = getTaxPercentage();
  if (storedSubtotal > 0 && storedTax > 0) {
    const inferredRate = (storedTax / storedSubtotal) * 100;
    if (inferredRate >= 1 && inferredRate <= 50) {
      gstRate = Math.round(inferredRate * 100) / 100;
    }
  }

  const taxAmount = (taxableAmount * gstRate) / 100;
  const totalAmount = taxableAmount + taxAmount;
  const advanceFee = (totalAmount * getAdvancePercentage()) / 100;

  // Check if the stored values already match the calculated values (within ₹1 tolerance)
  const storedTotal = Number(quotation.totalAmount || 0);
  const isAlreadyCorrect =
    Math.abs(storedTotal - totalAmount) < 1 &&
    Math.abs(storedSubtotal - netSubtotal) < 1;

  if (isAlreadyCorrect) {
    // DB values are correct — return as-is to avoid floating point drift
    return {
      ...quotation,
      advanceFee: quotation.advanceFee || advanceFee,
    };
  }

  // DB values are stale — return rehydrated version
  return {
    ...quotation,
    subtotal: netSubtotal,
    taxAmount,
    totalAmount,
    advanceFee,
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
