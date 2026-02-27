import mongoose from 'mongoose';

export interface IStoreBalance {
  balance: number;
  lastUpdated: Date;
}

const storeBalanceSchema = new mongoose.Schema<IStoreBalance>({
  balance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative'],
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Ensure only one document exists (singleton pattern)
storeBalanceSchema.index({ createdAt: -1 });

export const StoreBalance = mongoose.model<IStoreBalance>('StoreBalance', storeBalanceSchema);
