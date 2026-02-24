/**
 * Generate a unique SKU (Stock Keeping Unit) code
 * Format: PRD-YYYYMMDD-XXXX (where XXXX is a random 4-digit number)
 */
export const generateSKU = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `PRD-${dateStr}-${randomNum}`;
};

/**
 * Generate a unique transaction code
 * Format: TRX-YYYYMMDD-XXXXX
 */
export const generateTransactionCode = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `TRX-${dateStr}-${randomNum}`;
};

/**
 * Generate a unique purchase order code
 * Format: PO-YYYYMMDD-XXXXX
 */
export const generatePurchaseCode = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `PO-${dateStr}-${randomNum}`;
};
