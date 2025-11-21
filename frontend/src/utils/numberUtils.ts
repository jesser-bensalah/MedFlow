/**
 * Safely converts a value to a number with fallbacks
 * @param value - The value to convert to a number
 * @returns The converted number, or 0 if conversion fails
 */
export const toNumber = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

/**
 * Formats a number as a currency string
 * @param value - The value to format
 * @returns Formatted currency string (e.g., "123.45 TND")
 */
export const formatCurrency = (value: unknown): string => {
  return `${toNumber(value).toFixed(2)} TND`;
};
