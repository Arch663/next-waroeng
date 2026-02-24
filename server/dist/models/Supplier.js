"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Supplier = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const supplierSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, 'Supplier name is required'],
        trim: true,
    },
    contact: {
        type: String,
        required: [true, 'Contact information is required'],
        trim: true,
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
    },
}, {
    timestamps: true,
});
exports.Supplier = mongoose_1.default.model('Supplier', supplierSchema);
//# sourceMappingURL=Supplier.js.map