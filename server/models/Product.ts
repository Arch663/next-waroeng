import mongoose from 'mongoose';

export interface IProduct {
  name: string;
  sku: string;
  costPrice: number;
  price: number;
  stock: number;
  unit: string;
  categoryId: mongoose.Types.ObjectId;
  image?: string;
  minStock?: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new mongoose.Schema<IProduct>({
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
    type: mongoose.Schema.Types.ObjectId,
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

export const Product = mongoose.model<IProduct>('Product', productSchema);

