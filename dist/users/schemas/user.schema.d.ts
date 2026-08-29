import { Document } from 'mongoose';
import { UserRole } from '../../common/enums';
export type UserDocument = User & Document;
export declare class User {
    fullName: string;
    username: string;
    email: string;
    phone?: string;
    password: string;
    role: UserRole;
    isVip: boolean;
    vipExpiresAt?: Date | null;
    avatar?: string;
    deleted: boolean;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any, {}> & User & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<User> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
