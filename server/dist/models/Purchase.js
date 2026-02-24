"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Purchase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const purchaseItemSchema = new mongoose_1.default.Schema({
    productId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
    },
    buyPrice: {
        type: Number,
        required: true,
        min: [0, 'Buy price cannot be negative'],
    },
    subtotal: {
        type: Number,
        required: true,
    },
});
const purchaseSchema = new mongoose_1.default.Schema({
    items: {
        type: [purchaseItemSchema],
        required: true,
    },
    supplierId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true,
    },
    supplierName: {
        type: String,
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: [0, 'Total amount cannot be negative'],
    },
}, {
    timestamps: true,
});
// Index for date-based queries
purchaseSchema.index({ createdAt: -1 });
exports.Purchase = mongoose_1.default.model('Purchase', purchaseSchema);
//# sourceMappingURL=Purchase.js.map