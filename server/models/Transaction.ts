import mongoose from 'mongoose';

export interface ITransactionItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface ITransaction {
  items: ITransactionItem[];
  totalAmount: number;
  cashPaid: number;
  change: number;
  createdAt: Date;
}

const transactionItemSchema = new mongoose.Schema<ITransactionItem>({
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

const transactionSchema = new mongoose.Schema<ITransaction>({
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

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
