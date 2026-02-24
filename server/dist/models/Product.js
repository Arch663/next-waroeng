"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const productSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
    },
    sku: {
        type: String,
        unique: true,
        trim: true,
        index: true,
    },
    costPrice: {
        type: Number,
        required: [true, 'Cost price is required'],
        min: [0, 'Cost price cannot be negative'],
        default: 0,
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative'],
    },
    stock: {
        type: Number,
        required: [true, 'Stock is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0,
    },
    unit: {
        type: String,
        enum: ['pcs', 'box', 'kg', 'liter', 'pack', 'bottle', 'can', 'sachet', 'cup'],
        default: 'pcs',
    },
    categoryId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required'],
    },
    image: {
        type: String,
        default: '',
    },
    minStock: {
        type: Number,
        default: 5,
    },
}, {
    timestamps: true,
});
// Index for search optimization
productSchema.index({ name: 'text' });
exports.Product = mongoose_1.default.model('Product', productSchema);
//# sourceMappingURL=Product.js.map