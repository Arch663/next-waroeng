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
export declare const Purchase: mongoose.Model<IPurchase, {}, {}, {}, mongoose.Document<unknown, {}, IPurchase, {}, {}> & IPurchase & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>;
//# sourceMappingURL=Purchase.d.ts.map