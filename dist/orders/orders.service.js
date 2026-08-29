"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const order_schema_1 = require("./schemas/order.schema");
const coupons_service_1 = require("../coupons/coupons.service");
const users_service_1 = require("../users/users.service");
const product_schema_1 = require("../products/schemas/product.schema");
const enums_1 = require("../common/enums");
let OrdersService = class OrdersService {
    orderModel;
    productModel;
    couponsService;
    usersService;
    constructor(orderModel, productModel, couponsService, usersService) {
        this.orderModel = orderModel;
        this.productModel = productModel;
        this.couponsService = couponsService;
        this.usersService = usersService;
    }
    async create(userId, createOrderDto) {
        if (!createOrderDto.items || createOrderDto.items.length === 0) {
            throw new common_1.BadRequestException('سبد خرید نمی‌تواند خالی باشد.');
        }
        const user = await this.usersService.findById(userId);
        let subtotal = 0;
        const processedItems = [];
        for (const item of createOrderDto.items) {
            const product = await this.productModel.findOne({
                _id: item.product,
                deleted: false,
            });
            if (!product) {
                throw new common_1.BadRequestException(`محصول ${item.title} دیگر موجود نمی‌باشد.`);
            }
            const itemPrice = product.discountPrice && product.discountPrice > 0
                ? product.discountPrice
                : product.price;
            subtotal += itemPrice * item.quantity;
            processedItems.push({
                product: product._id,
                title: product.title,
                price: itemPrice,
                quantity: item.quantity,
                image: item.image ||
                    (product.images && product.images.length > 0 ? product.images[0] : ''),
                selectedAttributes: item.selectedAttributes || '',
            });
            await this.productModel.updateOne({ _id: product._id }, {
                $inc: { salesCount: item.quantity, stockCount: -item.quantity },
            });
        }
        const shippingFee = subtotal >= 1000000 ? 0 : 45000;
        let couponDiscount = 0;
        let validCouponCode = '';
        if (createOrderDto.couponCode) {
            try {
                const couponRes = await this.couponsService.validateCoupon({
                    code: createOrderDto.couponCode,
                    cartAmount: subtotal,
                });
                couponDiscount = couponRes.discountAmount;
                validCouponCode = couponRes.code;
                await this.couponsService.incrementUsage(validCouponCode);
            }
            catch (e) {
            }
        }
        let vipDiscount = 0;
        if (user.isVip) {
            vipDiscount = Math.round((subtotal - couponDiscount) * 0.05);
        }
        const total = Math.max(0, subtotal - couponDiscount - vipDiscount + shippingFee);
        const orderNumber = `HA-${Math.floor(100000 + Math.random() * 900000)}`;
        const order = new this.orderModel({
            orderNumber,
            user: new mongoose_2.Types.ObjectId(userId),
            items: processedItems,
            deliveryAddress: createOrderDto.deliveryAddress,
            paymentMethod: createOrderDto.paymentMethod || enums_1.PaymentMethod.ONLINE,
            subtotal,
            shippingFee,
            couponDiscount,
            vipDiscount,
            couponCode: validCouponCode,
            total,
            status: enums_1.OrderStatus.PROCESSING,
            notes: createOrderDto.notes || '',
        });
        return order.save();
    }
    async findUserOrders(userId) {
        return this.orderModel
            .find({ user: new mongoose_2.Types.ObjectId(userId), deleted: false })
            .sort({ createdAt: -1 })
            .exec();
    }
    async findById(id) {
        const order = await this.orderModel
            .findOne({ _id: id, deleted: false })
            .populate('user', 'fullName username email phone')
            .exec();
        if (!order) {
            throw new common_1.NotFoundException('سفارش مورد نظر یافت نشد.');
        }
        return order;
    }
    async findByOrderNumber(orderNumber) {
        const order = await this.orderModel
            .findOne({ orderNumber, deleted: false })
            .populate('user', 'fullName username email phone')
            .exec();
        if (!order) {
            throw new common_1.NotFoundException('سفارش مورد نظر یافت نشد.');
        }
        return order;
    }
    async findAll(query) {
        const page = Math.max(1, Number(query?.page) || 1);
        const pageSize = Math.max(1, Number(query?.pageSize) || 20);
        const skip = (page - 1) * pageSize;
        const filter = { deleted: false };
        if (query?.status) {
            filter.status = query.status;
        }
        if (query?.q) {
            filter.$or = [
                { orderNumber: { $regex: query.q, $options: 'i' } },
                { 'deliveryAddress.fullName': { $regex: query.q, $options: 'i' } },
                { 'deliveryAddress.phone': { $regex: query.q, $options: 'i' } },
            ];
        }
        const [items, total] = await Promise.all([
            this.orderModel
                .find(filter)
                .populate('user', 'fullName username email phone')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize)
                .exec(),
            this.orderModel.countDocuments(filter).exec(),
        ]);
        return {
            items,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }
    async updateStatus(id, dto) {
        const order = await this.findById(id);
        order.status = dto.status;
        if (dto.trackingCode) {
            order.trackingCode = dto.trackingCode;
        }
        return order.save();
    }
    async getDashboardStats() {
        const [totalOrders, totalSalesAgg, pendingOrders] = await Promise.all([
            this.orderModel.countDocuments({ deleted: false }),
            this.orderModel.aggregate([
                { $match: { deleted: false, status: { $ne: enums_1.OrderStatus.CANCELLED } } },
                { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
            ]),
            this.orderModel.countDocuments({
                status: { $in: [enums_1.OrderStatus.PENDING, enums_1.OrderStatus.PROCESSING] },
                deleted: false,
            }),
        ]);
        const totalRevenue = totalSalesAgg.length > 0 ? totalSalesAgg[0].totalRevenue : 0;
        return {
            totalOrders,
            totalRevenue,
            pendingOrders,
        };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __param(1, (0, mongoose_1.InjectModel)(product_schema_1.Product.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        coupons_service_1.CouponsService,
        users_service_1.UsersService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map