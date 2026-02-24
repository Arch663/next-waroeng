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
export declare const Transaction: mongoose.Model<ITransaction, {}, {}, {}, mongoose.Document<unknown, {}, ITransaction, {}, {}> & ITransaction & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>;
//# sourceMappingURL=Transaction.d.ts.map