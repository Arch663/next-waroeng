"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.History = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const historySchema = new mongoose_1.default.Schema({
    productId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['sold', 'bought', 'adjusted'],
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    stockBefore: {
        type: Number,
        required: true,
    },
    stockAfter: {
        type: Number,
        required: true,
    },
    referenceId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
    },
    notes: {
        type: String,
    },
}, {
    timestamps: true,
});
// Index for efficient queries
historySchema.index({ productId: 1, createdAt: -1 });
historySchema.index({ createdAt: -1 });
exports.History = mongoose_1.default.model('History', historySchema);
//# sourceMappingURL=History.js.map