import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto, UpdateOrderStatusDto } from './dtos';
import { CouponsService } from '../coupons/coupons.service';
import { UsersService } from '../users/users.service';
import { ProductDocument } from '../products/schemas/product.schema';
import { OrderStatus } from '../common/enums';
export declare class OrdersService {
    private orderModel;
    private productModel;
    private couponsService;
    private usersService;
    constructor(orderModel: Model<OrderDocument>, productModel: Model<ProductDocument>, couponsService: CouponsService, usersService: UsersService);
    create(userId: string, createOrderDto: CreateOrderDto): Promise<OrderDocument>;
    findUserOrders(userId: string): Promise<(import("mongoose").Document<unknown, {}, OrderDocument, {}, {}> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    findById(id: string): Promise<OrderDocument>;
    findByOrderNumber(orderNumber: string): Promise<OrderDocument>;
    findAll(query?: {
        page?: number;
        pageSize?: number;
        status?: OrderStatus;
        q?: string;
    }): Promise<{
        items: (import("mongoose").Document<unknown, {}, OrderDocument, {}, {}> & Order & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<OrderDocument>;
    getDashboardStats(): Promise<{
        totalOrders: number;
        totalRevenue: any;
        pendingOrders: number;
    }>;
}
