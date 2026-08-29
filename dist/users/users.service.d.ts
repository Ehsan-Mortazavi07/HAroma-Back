import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto } from './dtos';
import { UserRole } from '../common/enums';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    create(createUserDto: CreateUserDto): Promise<UserDocument>;
    findAll(query: {
        page?: number;
        pageSize?: number;
        q?: string;
        role?: string;
    }): Promise<{
        items: (import("mongoose").Document<unknown, {}, UserDocument, {}, {}> & User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    findById(id: string): Promise<UserDocument>;
    findByUsernameOrEmail(identifier: string): Promise<UserDocument | null>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument>;
    setRole(id: string, role: UserRole): Promise<UserDocument>;
    toggleVip(id: string, isVip: boolean, durationDays?: number): Promise<UserDocument>;
    softDelete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    countTotal(): Promise<number>;
    countVip(): Promise<number>;
}
