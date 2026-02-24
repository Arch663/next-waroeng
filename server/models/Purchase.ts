import mongoose from 'mongoose';

export interface IPurchaseItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  buyPrice: number;
  subtotal: number;
}

export interface IPurchase {
  items: IPurchaseItem[];
  supplierId: mongoose.Types.ObjectId;
  supplierName: string;
  totalAmount: number;
  createdAt: Date;
}

const purchaseItemSchema = new mongoose.Schema<IPurchaseItem>({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
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

const purchaseSchema = new mongoose.Schema<IPurchase>({
  items: {
    type: [purchaseItemSchema],
    required: true,
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
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

export const Purchase = mongoose.model<IPurchase>('Purchase', purchaseSchema);
