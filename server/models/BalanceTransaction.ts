import mongoose from 'mongoose';

export type BalanceTransactionType = 'deposit' | 'withdraw' | 'sale' | 'purchase';

export interface IBalanceTransaction {
  type: BalanceTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  referenceId?: mongoose.Types.ObjectId;
  referenceType?: 'transaction' | 'purchase' | 'manual';
  createdAt: Date;
}

const balanceTransactionSchema = new mongoose.Schema<IBalanceTransaction>({
  type: {
    type: String,
    enum: ['deposit', 'withdraw', 'sale', 'purchase'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  balanceBefore: {
    type: Number,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  referenceType: {
    type: String,
    enum: ['transaction', 'purchase', 'manual'],
  },
}, {
  timestamps: true,
});

// Index for querying by date and reference
balanceTransactionSchema.index({ createdAt: -1 });
balanceTransactionSchema.index({ referenceId: 1, referenceType: 1 });

export const BalanceTransaction = mongoose.model<IBalanceTransaction>('BalanceTransaction', balanceTransactionSchema);
