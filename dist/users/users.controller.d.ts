import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dtos';
import { UserRole } from '../common/enums';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(user: any): Promise<import("./schemas/user.schema").UserDocument>;
    updateProfile(user: any, dto: UpdateUserDto): Promise<import("./schemas/user.schema").UserDocument>;
    listUsers(page?: number, pageSize?: number, q?: string, role?: string): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("./schemas/user.schema").UserDocument, {}, {}> & import("./schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    getUser(id: string): Promise<import("./schemas/user.schema").UserDocument>;
    createUser(dto: CreateUserDto): Promise<import("./schemas/user.schema").UserDocument>;
    updateUser(id: string, dto: UpdateUserDto): Promise<import("./schemas/user.schema").UserDocument>;
    setRole(id: string, role: UserRole): Promise<import("./schemas/user.schema").UserDocument>;
    toggleVip(id: string, isVip: boolean, durationDays?: number): Promise<import("./schemas/user.schema").UserDocument>;
    deleteUser(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
