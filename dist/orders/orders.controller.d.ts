import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dtos';
import { OrderStatus } from '../common/enums';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    createOrder(user: any, dto: CreateOrderDto): Promise<import("./schemas/order.schema").OrderDocument>;
    getMyOrders(user: any): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/order.schema").OrderDocument, {}, {}> & import("./schemas/order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getOrderById(id: string): Promise<import("./schemas/order.schema").OrderDocument>;
    trackOrder(orderNumber: string): Promise<import("./schemas/order.schema").OrderDocument>;
    adminListOrders(page?: number, pageSize?: number, status?: OrderStatus, q?: string): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("./schemas/order.schema").OrderDocument, {}, {}> & import("./schemas/order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    getDashboardStats(): Promise<{
        totalOrders: number;
        totalRevenue: any;
        pendingOrders: number;
    }>;
    adminGetOrder(id: string): Promise<import("./schemas/order.schema").OrderDocument>;
    adminUpdateOrderStatus(id: string, dto: UpdateOrderStatusDto): Promise<import("./schemas/order.schema").OrderDocument>;
}
