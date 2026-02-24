import mongoose from 'mongoose';
export type StockMovementType = 'sold' | 'bought' | 'adjusted';
export interface IHistory {
    productId: mongoose.Types.ObjectId;
    productName: string;
    type: StockMovementType;
    quantity: number;
    stockBefore: number;
    stockAfter: number;
    referenceId?: mongoose.Types.ObjectId;
    notes?: string;
    createdAt: Date;
}
export declare const History: mongoose.Model<IHistory, {}, {}, {}, mongoose.Document<unknown, {}, IHistory, {}, {}> & IHistory & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>;
//# sourceMappingURL=History.d.ts.map