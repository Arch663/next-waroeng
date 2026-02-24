"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePurchaseCode = exports.generateTransactionCode = exports.generateSKU = void 0;
/**
 * Generate a unique SKU (Stock Keeping Unit) code
 * Format: PRD-YYYYMMDD-XXXX (where XXXX is a random 4-digit number)
 */
const generateSKU = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `PRD-${dateStr}-${randomNum}`;
};
exports.generateSKU = generateSKU;
/**
 * Generate a unique transaction code
 * Format: TRX-YYYYMMDD-XXXXX
 */
const generateTransactionCode = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `TRX-${dateStr}-${randomNum}`;
};
exports.generateTransactionCode = generateTransactionCode;
/**
 * Generate a unique purchase order code
 * Format: PO-YYYYMMDD-XXXXX
 */
const generatePurchaseCode = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `PO-${dateStr}-${randomNum}`;
};
exports.generatePurchaseCode = generatePurchaseCode;
//# sourceMappingURL=skuGenerator.js.map