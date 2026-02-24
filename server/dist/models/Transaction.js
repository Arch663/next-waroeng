"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const transactionItemSchema = new mongoose_1.default.Schema({
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
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative'],
    },
    subtotal: {
        type: Number,
        required: true,
    },
});
const transactionSchema = new mongoose_1.default.Schema({
    items: {
        type: [transactionItemSchema],
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: [0, 'Total amount cannot be negative'],
    },
    cashPaid: {
        type: Number,
        required: true,
        min: [0, 'Cash paid cannot be negative'],
    },
    change: {
        type: Number,
        required: true,
        min: [0, 'Change cannot be negative'],
    },
}, {
    timestamps: true,
});
// Index for date-based queries
transactionSchema.index({ createdAt: -1 });
exports.Transaction = mongoose_1.default.model('Transaction', transactionSchema);
//# sourceMappingURL=Transaction.js.map