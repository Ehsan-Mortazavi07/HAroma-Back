import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto, UpdateOrderStatusDto } from './dtos';
import { CouponsService } from '../coupons/coupons.service';
import { UsersService } from '../users/users.service';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { OrderStatus, PaymentMethod } from '../common/enums';

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private couponsService: CouponsService,
    private usersService: UsersService,
  ) {}

  async onModuleInit() {
    // Purge legacy soft-deleted documents from database
    await this.orderModel.deleteMany({ deleted: true }).catch(() => {});
  }

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<OrderDocument> {
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('سبد خرید نمی‌تواند خالی باشد.');
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
        throw new BadRequestException(`محصول ${item.title} دیگر موجود نمی‌باشد.`);
      }

      const itemPrice =
        product.discountPrice && product.discountPrice > 0
          ? product.discountPrice
          : product.price;

      subtotal += itemPrice * item.quantity;

      processedItems.push({
        product: product._id,
        title: product.title,
        price: itemPrice,
        quantity: item.quantity,
        image:
          item.image ||
          (product.images && product.images.length > 0 ? product.images[0] : ''),
        selectedAttributes: item.selectedAttributes || '',
      });

      // Update product sales and stock
      await this.productModel.updateOne(
        { _id: product._id },
        {
          $inc: { salesCount: item.quantity, stockCount: -item.quantity },
        },
      );
    }

    // Free shipping threshold: 1,000,000 Tomans
    const shippingFee = subtotal >= 1000000 ? 0 : 45000;

    // Calculate coupon discount
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
      } catch (e) {
        // invalid coupon ignored or warning
      }
    }

    // VIP Discount (5% extra discount for active VIP users)
    let vipDiscount = 0;
    if (user.isVip) {
      vipDiscount = Math.round((subtotal - couponDiscount) * 0.05);
    }

    const total = Math.max(0, subtotal - couponDiscount - vipDiscount + shippingFee);

    const orderNumber = `HA-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = new this.orderModel({
      orderNumber,
      user: new Types.ObjectId(userId),
      items: processedItems,
      deliveryAddress: createOrderDto.deliveryAddress,
      paymentMethod: createOrderDto.paymentMethod || PaymentMethod.ONLINE,
      subtotal,
      shippingFee,
      couponDiscount,
      vipDiscount,
      couponCode: validCouponCode,
      shippingMethod: 'standard',
      total,
      status: OrderStatus.PROCESSING,
      statusHistory: [{ status: OrderStatus.PROCESSING, changedAt: new Date() }],
      notes: createOrderDto.notes || '',
    });

    const savedOrder = await order.save();

    // If user profile does not have address/city saved yet, auto-populate from this purchase
    if ((!user.address || !user.city) && createOrderDto.deliveryAddress) {
      try {
        const da = createOrderDto.deliveryAddress;
        await this.usersService.update(userId, {
          province: user.province || da.province,
          city: user.city || da.city,
          address: user.address || da.addressDetail,
          postalCode: user.postalCode || da.postalCode,
          buildingNumber: user.buildingNumber || da.buildingNumber,
          unit: user.unit || da.unit,
          recipientName: user.recipientName || da.fullName,
          recipientPhone: user.recipientPhone || da.phone,
          recipientEmail: user.recipientEmail || da.email,
          addressNotes: user.addressNotes || da.description,
        });
      } catch (err) {
        // Non-blocking if profile update fails
      }
    }

    return savedOrder;
  }

  async findUserOrders(userId: string) {
    return this.orderModel
      .find({ user: new Types.ObjectId(userId), deleted: false })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findOne({ _id: id, deleted: false })
      .populate('user', 'fullName username email phone')
      .exec();

    if (!order) {
      throw new NotFoundException('سفارش مورد نظر یافت نشد.');
    }
    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findOne({ orderNumber, deleted: false })
      .populate('user', 'fullName username email phone')
      .exec();

    if (!order) {
      throw new NotFoundException('سفارش مورد نظر یافت نشد.');
    }
    return order;
  }

  async findAll(query?: {
    page?: number;
    pageSize?: number;
    status?: OrderStatus;
    q?: string;
    userId?: string;
  }) {
    const page = Math.max(1, Number(query?.page) || 1);
    const pageSize = Math.max(1, Number(query?.pageSize) || 20);
    const skip = (page - 1) * pageSize;

    const filter: any = { deleted: false };
    if (query?.status) {
      filter.status = query.status;
    }
    if (query?.userId && Types.ObjectId.isValid(query.userId)) {
      filter.user = new Types.ObjectId(query.userId);
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

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderDocument> {
    const order = await this.findById(id);
    const changedAt = new Date();
    if (order.status !== dto.status) {
      order.status = dto.status;
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({ status: dto.status, changedAt });
      if (dto.status === OrderStatus.SHIPPED && !order.shippedAt) {
        order.shippedAt = changedAt;
      }
      if (dto.status === OrderStatus.DELIVERED && !order.deliveredAt) {
        order.deliveredAt = changedAt;
      }
    }
    if (dto.trackingCode !== undefined) {
      order.trackingCode = dto.trackingCode;
    }
    if (dto.shippingProvider !== undefined) {
      order.shippingProvider = dto.shippingProvider.trim();
    }
    if (dto.trackingUrl !== undefined) {
      order.trackingUrl = dto.trackingUrl.trim();
    }
    return order.save();
  }

  async bulkUpdateStatus(
    ids: string[],
    status: OrderStatus,
  ): Promise<{ success: boolean; modifiedCount: number }> {
    const validIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (validIds.length === 0) {
      return { success: true, modifiedCount: 0 };
    }

    const changedAt = new Date();
    const changedOrders = await this.orderModel
      .find({ _id: { $in: validIds }, deleted: false, status: { $ne: status } })
      .select('_id shippedAt deliveredAt')
      .lean()
      .exec();

    if (changedOrders.length === 0) {
      return { success: true, modifiedCount: 0 };
    }

    const writes = changedOrders.map((order) => {
      const set: Record<string, unknown> = { status };
      if (status === OrderStatus.SHIPPED && !order.shippedAt) set.shippedAt = changedAt;
      if (status === OrderStatus.DELIVERED && !order.deliveredAt) set.deliveredAt = changedAt;

      return {
        updateOne: {
          filter: { _id: order._id, deleted: false, status: { $ne: status } },
          update: {
            $set: set,
            $push: { statusHistory: { status, changedAt } },
          },
        },
      };
    });
    const result = await this.orderModel.bulkWrite(writes);
    return { success: true, modifiedCount: result.modifiedCount };
  }

  async deleteOne(id: string): Promise<{ success: boolean; message: string }> {
    const order = await this.findById(id);
    await this.orderModel.deleteOne({ _id: order._id });
    return { success: true, message: 'سفارش با موفقیت حذف شد.' };
  }

  async bulkSoftDelete(ids: string[]): Promise<{ success: boolean; modifiedCount: number }> {
    const validIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const result = await this.orderModel.deleteMany({
      _id: { $in: validIds },
    });
    return { success: true, modifiedCount: result.deletedCount || 0 };
  }

  async getDashboardStats() {
    const [totalOrders, totalSalesAgg, pendingOrders] = await Promise.all([
      this.orderModel.countDocuments({ deleted: false }),
      this.orderModel.aggregate([
        { $match: { deleted: false, status: { $ne: OrderStatus.CANCELLED } } },
        { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
      ]),
      this.orderModel.countDocuments({
        status: { $in: [OrderStatus.PENDING, OrderStatus.PROCESSING] },
        deleted: false,
      }),
    ]);

    const totalRevenue =
      totalSalesAgg.length > 0 ? totalSalesAgg[0].totalRevenue : 0;

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
    };
  }
}
