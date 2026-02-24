import mongoose from 'mongoose';

export type StockMovementType = 'sold' | 'bought' | 'adjusted';

export interface IHistory {
  productId: mongoose.Types.ObjectId;
  productName: string;
  type: StockMovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  referenceId?: mongoose.Types.ObjectId; // Transaction or Purchase ID
  notes?: string;
  createdAt: Date;
}

const historySchema = new mongoose.Schema<IHistory>({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
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
    type: mongoose.Schema.Types.ObjectId,
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

export const History = mongoose.model<IHistory>('History', historySchema);
