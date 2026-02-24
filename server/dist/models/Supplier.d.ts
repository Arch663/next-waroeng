import mongoose from 'mongoose';
export interface ISupplier {
    name: string;
    contact: string;
    address: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Supplier: mongoose.Model<ISupplier, {}, {}, {}, mongoose.Document<unknown, {}, ISupplier, {}, {}> & ISupplier & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>;
//# sourceMappingURL=Supplier.d.ts.map