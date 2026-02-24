import mongoose from 'mongoose';

export interface ISupplier {
  name: string;
  contact: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new mongoose.Schema<ISupplier>({
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

export const Supplier = mongoose.model<ISupplier>('Supplier', supplierSchema);
