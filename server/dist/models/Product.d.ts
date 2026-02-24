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
export declare const Product: mongoose.Model<IProduct, {}, {}, {}, mongoose.Document<unknown, {}, IProduct, {}, {}> & IProduct & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>;
//# sourceMappingURL=Product.d.ts.map