import mongoose from 'mongoose';

export interface ICategory {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new mongoose.Schema<ICategory>({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
  },
}, {
  timestamps: true,
});

export const Category = mongoose.model<ICategory>('Category', categorySchema);
