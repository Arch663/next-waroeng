import mongoose from 'mongoose';
export type UserRole = 'admin' | 'manager' | 'cashier';
export interface IUser {
    username: string;
    password: string;
    role: UserRole;
    email?: string;
    fullName?: string;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map