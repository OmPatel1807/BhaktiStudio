/**
 * Format raw currency numbers into standard INR currency string
 * @param {number} amount 
 * @returns {string} e.g. "₹1,50,000.00"
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format LED screen dimensions into square footage
 * @param {number} widthFeet 
 * @param {number} heightFeet 
 * @returns {number} square feet
 */
export const calculateSqFt = (widthFeet, heightFeet) => {
  const w = parseFloat(widthFeet) || 0;
  const h = parseFloat(heightFeet) || 0;
  return w * h;
};

/**
 * Format date string into human-friendly representation
 * @param {string | Date} dateStr 
 * @returns {string} e.g. "15 Aug 2026, 10:00 AM"
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};
