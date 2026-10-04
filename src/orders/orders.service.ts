import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto, UpdateAdminOrderDto, UpdateOrderStatusDto } from './dtos';
import { CouponsService } from '../coupons/coupons.service';
import { UsersService } from '../users/users.service';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { OrderStatus, PaymentMethod } from '../common/enums';
import { normalizeSearchQuery } from '../common/utils/search.util';
import { parsePage, parsePageSize } from '../common/utils/pagination.util';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private couponsService: CouponsService,
    private usersService: UsersService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<OrderDocument> {
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('سبد خرید نمی‌تواند خالی باشد.');
    }

    // Payment gateways are not integrated yet; never mark an unpaid online order as processing.
    if (createOrderDto.paymentMethod && createOrderDto.paymentMethod !== PaymentMethod.COD) {
      throw new ServiceUnavailableException('این روش پرداخت هنوز فعال نشده است.');
    }

    const user = await this.usersService.findById(userId);

    const productIds = [...new Set(createOrderDto.items.map((item) => item.product))];
    const products = await this.productModel
      .find({ _id: { $in: productIds }, deleted: false, isPublished: { $ne: false } })
      .select('_id title price discountPrice images stockCount inStock variants deleted isPublished')
      .exec();
    const productsById = new Map(products.map((product) => [String(product._id), product]));

    let subtotal = 0;
    const processedItems = createOrderDto.items.map((item) => {
      const product = productsById.get(item.product);
      if (!product) {
        throw new BadRequestException('یکی از کالاهای سبد خرید دیگر در دسترس نیست.');
      }

      const variant = item.variantId
        ? product.variants?.find((candidate) => candidate.id === item.variantId)
        : undefined;
      if (item.variantId && !variant) {
        throw new BadRequestException('ویژگی انتخاب‌شده برای یکی از کالاها معتبر نیست.');
      }

      const inventory = variant || product;
      if (!inventory.inStock || inventory.stockCount < 0) {
        throw new BadRequestException('یکی از کالاهای سبد خرید موجود نیست.');
      }
      const price = inventory.discountPrice && inventory.discountPrice > 0
        ? inventory.discountPrice
        : inventory.price;
      if (!Number.isSafeInteger(price) || price < 0) {
        throw new BadRequestException('قیمت یکی از کالاها معتبر نیست.');
      }

      subtotal += price * item.quantity;
      if (!Number.isSafeInteger(subtotal)) {
        throw new BadRequestException('مبلغ سفارش از حد مجاز بیشتر است.');
      }
      const variantTitle = variant?.title || '';
      return {
        product: product._id,
        title: variantTitle ? `${product.title} (${variantTitle})` : product.title,
        price,
        quantity: item.quantity,
        image: product.images?.[0] || '',
        selectedAttributes: variantTitle || item.selectedAttributes || '',
        variantId: variant?.id || '',
      };
    });

    const stockDeltas = this.sumOrderItemQuantities(processedItems);

    // Free shipping threshold: 1,000,000 Tomans
    const shippingFee = subtotal >= 1000000 ? 0 : 45000;

    // Calculate coupon discount
    let couponDiscount = 0;
    let validCouponCode = '';
    let couponReserved = false;
    if (createOrderDto.couponCode?.trim()) {
      const couponRes = await this.couponsService.validateCoupon({
        code: createOrderDto.couponCode,
        cartAmount: subtotal,
      });
      couponDiscount = couponRes.discountAmount;
      validCouponCode = couponRes.code;
      await this.couponsService.reserveUsage(validCouponCode);
      couponReserved = true;
    }

    // VIP Discount (5% extra discount for active VIP users)
    let vipDiscount = 0;
    if (user.isVip) {
      vipDiscount = Math.round((subtotal - couponDiscount) * 0.05);
    }

    const total = Math.max(0, subtotal - couponDiscount - vipDiscount + shippingFee);

    const orderNumber = `HA-${randomInt(100000, 1_000_000)}`;

    const order = new this.orderModel({
      orderNumber,
      user: new Types.ObjectId(userId),
      items: processedItems,
      deliveryAddress: createOrderDto.deliveryAddress,
      paymentMethod: PaymentMethod.COD,
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

    const appliedInventoryChanges: Array<{ key: string; quantity: number }> = [];
    let savedOrder: OrderDocument;
    try {
      for (const [key, quantity] of stockDeltas) {
        const separatorIndex = key.indexOf(':');
        const productId = key.slice(0, separatorIndex);
        const variantId = key.slice(separatorIndex + 1);
        const product = productsById.get(productId);
        if (!product) throw new BadRequestException('یکی از کالاهای سفارش دیگر در دسترس نیست.');

        const filter: Record<string, unknown> = {
          _id: product._id,
          deleted: false,
          isPublished: { $ne: false },
          inStock: true,
        };
        const update: Record<string, unknown> = {
          $inc: { salesCount: quantity },
        };
        const options: Record<string, unknown> = {};
        if (variantId) {
          filter.variants = {
            $elemMatch: { id: variantId, inStock: true, stockCount: { $gte: quantity } },
          };
          update.$inc = { salesCount: quantity, 'variants.$[variant].stockCount': -quantity };
          options.arrayFilters = [{ 'variant.id': variantId, 'variant.inStock': true, 'variant.stockCount': { $gte: quantity } }];
        } else {
          filter.stockCount = { $gte: quantity };
          update.$inc = { salesCount: quantity, stockCount: -quantity };
        }

        const result = await this.productModel.updateOne(filter, update, options).exec();
        if (result.modifiedCount !== 1) {
          throw new BadRequestException('موجودی یکی از کالاها برای تعداد انتخاب‌شده کافی نیست.');
        }
        appliedInventoryChanges.push({ key, quantity });
      }

      savedOrder = await order.save();
    } catch (error) {
      await Promise.all(appliedInventoryChanges.map(({ key, quantity }) =>
        this.adjustInventoryForOrderItem(key, -quantity).catch(() => undefined),
      ));
      if (couponReserved) {
        await this.couponsService.releaseUsage(validCouponCode).catch(() => undefined);
      }
      if ((error as { code?: number })?.code === 11000) {
        throw new BadRequestException('خطایی در ثبت سفارش رخ داد؛ دوباره تلاش کنید.');
      }
      throw error;
    }

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

  async findUserOrderById(id: string, userId: string): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('سفارش مورد نظر یافت نشد.');
    }
    const order = await this.orderModel
      .findOne({ _id: id, user: new Types.ObjectId(userId), deleted: false })
      .exec();
    if (!order) throw new NotFoundException('سفارش مورد نظر یافت نشد.');
    return order;
  }

  async findById(id: string, includeAdminChangeNotes = false): Promise<OrderDocument> {
    const query = this.orderModel
      .findOne({ _id: id, deleted: false })
      .populate('user', 'fullName username email phone');
    if (includeAdminChangeNotes) query.select('+adminChangeNotes');
    const order = await query.exec();

    if (!order) {
      throw new NotFoundException('سفارش مورد نظر یافت نشد.');
    }
    return order;
  }

  async findAdminChangeNotes(id: string) {
    const order = await this.orderModel
      .findOne({ _id: id, deleted: false })
      .select('+adminChangeNotes')
      .exec();
    if (!order) throw new NotFoundException('سفارش مورد نظر یافت نشد.');
    return order.adminChangeNotes || [];
  }

  async findByOrderNumber(orderNumber: string, userId: string): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('سفارش مورد نظر یافت نشد.');
    }
    const order = await this.orderModel
      .findOne({ orderNumber, user: new Types.ObjectId(userId), deleted: false })
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
    const page = parsePage(query?.page);
    const pageSize = parsePageSize(query?.pageSize);
    const skip = (page - 1) * pageSize;

    const filter: any = { deleted: false };
    if (query?.status) {
      filter.status = query.status;
    }
    if (query?.userId && Types.ObjectId.isValid(query.userId)) {
      filter.user = new Types.ObjectId(query.userId);
    }
    const searchQuery = normalizeSearchQuery(query?.q, 100);
    if (searchQuery) {
      filter.$or = [
        { orderNumber: { $regex: searchQuery, $options: 'i' } },
        { 'deliveryAddress.fullName': { $regex: searchQuery, $options: 'i' } },
        { 'deliveryAddress.phone': { $regex: searchQuery, $options: 'i' } },
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

  async updateOrder(
    id: string,
    dto: UpdateAdminOrderDto,
    admin: { id: string; name: string },
  ): Promise<OrderDocument> {
    const order = await this.findById(id);
    const orderId = order._id;
    const currentVersion = order.get('__v');
    const actualVersion = typeof currentVersion === 'number' ? currentVersion : 0;
    if (dto.version !== actualVersion) {
      throw new BadRequestException('این سفارش هم‌زمان تغییر کرده است؛ صفحه را تازه کنید و دوباره تلاش کنید.');
    }

    const existingItems = order.items || [];
    const indexesToRemove = new Set(dto.removeItemIndexes || []);
    if ([...indexesToRemove].some((index) => index >= existingItems.length)) {
      throw new BadRequestException('یکی از اقلام انتخاب‌شده برای حذف دیگر در این سفارش نیست.');
    }

    const quantityUpdates = new Map<number, number>();
    for (const update of dto.itemQuantityUpdates || []) {
      if (update.index >= existingItems.length) {
        throw new BadRequestException('یکی از اقلام انتخاب‌شده برای ویرایش دیگر در این سفارش نیست.');
      }
      if (indexesToRemove.has(update.index)) {
        throw new BadRequestException('یک قلم را نمی‌توان هم‌زمان ویرایش و حذف کرد.');
      }
      if (quantityUpdates.has(update.index)) {
        throw new BadRequestException('یک قلم سفارش بیش از یک‌بار برای ویرایش فرستاده شده است.');
      }
      quantityUpdates.set(update.index, update.quantity);
    }

    const addItems = dto.addItems || [];
    const hasItemChanges = indexesToRemove.size > 0 || quantityUpdates.size > 0 || addItems.length > 0;
    if (hasItemChanges && [OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(order.status)) {
      throw new BadRequestException('پس از ارسال یا لغو سفارش، تغییر اقلام امکان‌پذیر نیست.');
    }

    const addedProductIds = [...new Set(addItems.map((item) => item.productId))];
    const products = addedProductIds.length
      ? await this.productModel
          .find({ _id: { $in: addedProductIds } })
          .select('_id title price discountPrice images stockCount inStock variants deleted isPublished')
          .lean()
          .exec()
      : [];
    const productsById = new Map(products.map((product) => [String(product._id), product]));

    const retainedItems = existingItems
      .map((item, index) => ({
        product: item.product,
        title: item.title,
        price: item.price,
        quantity: quantityUpdates.get(index) ?? item.quantity,
        image: item.image || '',
        selectedAttributes: item.selectedAttributes || '',
        variantId: item.variantId || '',
        index,
      }))
      .filter((item) => !indexesToRemove.has(item.index))
      .map(({ index: _index, ...item }) => item);

    const addedItems = addItems.map((item) => {
      const product = productsById.get(item.productId);
      if (!product || product.deleted || product.isPublished === false) {
        throw new BadRequestException('یکی از کالاهای انتخاب‌شده در دسترس نیست.');
      }

      const variant = item.variantId
        ? product.variants?.find((candidate) => candidate.id === item.variantId)
        : undefined;
      if (item.variantId && !variant) {
        throw new BadRequestException('ویژگی انتخاب‌شده برای یکی از کالاها معتبر نیست.');
      }
      const priceSource = variant || product;
      if (!priceSource.inStock || priceSource.stockCount < 0) {
        throw new BadRequestException('یکی از کالاهای انتخاب‌شده موجود نیست.');
      }
      const price = priceSource.discountPrice && priceSource.discountPrice > 0
        ? priceSource.discountPrice
        : priceSource.price;
      if (!Number.isSafeInteger(price) || price < 0) {
        throw new BadRequestException('قیمت یکی از کالاها معتبر نیست.');
      }
      return {
        product: new Types.ObjectId(item.productId),
        title: variant ? `${product.title} (${variant.title})` : product.title,
        price,
        quantity: item.quantity,
        image: product.images?.[0] || '',
        selectedAttributes: variant?.title || '',
        variantId: variant?.id || '',
      };
    });
    const nextItems = [...retainedItems, ...addedItems];
    if (nextItems.length < 1) {
      throw new BadRequestException('سفارش باید حداقل یک قلم کالا داشته باشد.');
    }

    const oldQuantities = this.sumOrderItemQuantities(existingItems);
    const newQuantities = this.sumOrderItemQuantities(nextItems);
    const inventoryKeys = [...new Set([...oldQuantities.keys(), ...newQuantities.keys()])];
    const productIds = [...new Set(inventoryKeys.map((key) => key.slice(0, key.indexOf(':'))))];
    if (productIds.some((productId) => !Types.ObjectId.isValid(productId))) {
      throw new BadRequestException('شناسه یکی از محصولات سفارش نامعتبر است.');
    }
    const inventoryProducts = productIds.length
      ? await this.productModel
          .find({ _id: { $in: productIds } })
          .select('_id deleted isPublished inStock stockCount variants')
          .lean()
          .exec()
      : [];
    const inventoryProductsById = new Map(inventoryProducts.map((product) => [String(product._id), product]));
    const quantityDeltas = new Map(inventoryKeys.map((key) => [
      key,
      (newQuantities.get(key) || 0) - (oldQuantities.get(key) || 0),
    ]));

    const subtotal = nextItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = Math.max(
      0,
      subtotal - order.couponDiscount - order.vipDiscount + order.shippingFee + order.tax,
    );
    const update: Record<string, unknown> = {
      items: nextItems,
      deliveryAddress: dto.deliveryAddress,
      subtotal,
      total,
      updatedAt: new Date(),
    };

    const adminNote = dto.adminNote?.trim();
    const changeNote = adminNote
      ? {
          note: adminNote,
          adminId: admin.id,
          adminName: admin.name,
          createdAt: new Date(),
        }
      : null;

    const appliedInventoryChanges: Array<{ key: string; delta: number }> = [];
    try {
      if (hasItemChanges) {
        for (const [key, delta] of quantityDeltas) {
          if (delta === 0) continue;
          const separatorIndex = key.indexOf(':');
          const productId = key.slice(0, separatorIndex);
          const variantId = key.slice(separatorIndex + 1);
          const product = inventoryProductsById.get(productId);
          if (!product) {
            if (delta > 0) throw new BadRequestException('یکی از کالاهای سفارش دیگر در دسترس نیست.');
            continue;
          }

          const filter: Record<string, unknown> = { _id: product._id };
          const update: Record<string, unknown> = { $inc: { salesCount: delta } };
          const options: Record<string, unknown> = {};
          if (variantId) {
            const variant = product.variants?.find((candidate) => candidate.id === variantId);
            if (!variant) {
              if (delta > 0) throw new BadRequestException('واریانت یکی از کالاهای سفارش دیگر در دسترس نیست.');
              continue;
            }
            if (delta > 0) {
              if (product.deleted || product.isPublished === false || !variant.inStock) {
                throw new BadRequestException('یکی از کالاهای سفارش دیگر در دسترس نیست.');
              }
              filter.variants = { $elemMatch: { id: variantId, inStock: true, stockCount: { $gte: delta } } };
            }
            update.$inc = { salesCount: delta, 'variants.$[variant].stockCount': -delta };
            options.arrayFilters = [{ 'variant.id': variantId }];
          } else {
            if (delta > 0) {
              if (product.deleted || product.isPublished === false || !product.inStock) {
                throw new BadRequestException('یکی از کالاهای سفارش دیگر در دسترس نیست.');
              }
              filter.stockCount = { $gte: delta };
            }
            update.$inc = { salesCount: delta, stockCount: -delta };
          }
          const result = await this.productModel.updateOne(filter, update, options).exec();
          if (result.modifiedCount !== 1) {
            throw new BadRequestException(delta > 0
              ? 'موجودی یکی از کالاها برای این تعداد کافی نیست.'
              : 'موجودی یکی از کالاها هم‌زمان تغییر کرده است؛ دوباره تلاش کنید.');
          }
          appliedInventoryChanges.push({ key, delta });
        }
      }

      const versionFilter: Record<string, unknown> = {
        _id: orderId,
        deleted: false,
        __v: typeof currentVersion === 'number' ? currentVersion : { $exists: false },
      };
      const updateOperation: Record<string, unknown> = {
        $set: update,
        $inc: { __v: 1 },
      };
      if (changeNote) {
        updateOperation.$push = {
          adminChangeNotes: { $each: [changeNote], $slice: -100 },
        };
      }
      const orderUpdateResult = await this.orderModel.updateOne(
        versionFilter,
        updateOperation,
        { runValidators: true, timestamps: false },
      ).exec();
      if (orderUpdateResult.matchedCount !== 1) {
        const stillExists = await this.orderModel.exists({ _id: orderId, deleted: false });
        if (!stillExists) throw new NotFoundException('سفارش مورد نظر یافت نشد.');
        throw new BadRequestException('این سفارش هم‌زمان تغییر کرده است؛ صفحه را تازه کنید و دوباره تلاش کنید.');
      }
    } catch (error) {
      await Promise.all(appliedInventoryChanges.map(({ key, delta }) =>
        this.adjustInventoryForOrderItem(key, -delta).catch(() => undefined),
      ));
      if ((error as { code?: number })?.code === 11000) {
        throw new BadRequestException('شماره سفارش تکراری است.');
      }
      throw error;
    }
    return this.findById(id, true);
  }

  private sumOrderItemQuantities(items: Array<{ product: Types.ObjectId | string; quantity: number; variantId?: string }>) {
    const totals = new Map<string, number>();
    for (const item of items) {
      const key = `${String(item.product)}:${item.variantId || ''}`;
      totals.set(key, (totals.get(key) || 0) + item.quantity);
    }
    return totals;
  }

  private async adjustInventoryForOrderItem(key: string, quantityDelta: number): Promise<void> {
    const separatorIndex = key.indexOf(':');
    const productId = key.slice(0, separatorIndex);
    const variantId = key.slice(separatorIndex + 1);
    if (variantId) {
      await this.productModel.updateOne(
        { _id: new Types.ObjectId(productId) },
        { $inc: { salesCount: quantityDelta, 'variants.$[variant].stockCount': -quantityDelta } },
        { arrayFilters: [{ 'variant.id': variantId }] },
      ).exec();
      return;
    }
    await this.productModel.updateOne(
      { _id: new Types.ObjectId(productId) },
      { $inc: { salesCount: quantityDelta, stockCount: -quantityDelta } },
    ).exec();
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
    await this.orderModel.updateOne({ _id: order._id }, { $set: { deleted: true } });
    return { success: true, message: 'سفارش با موفقیت حذف شد.' };
  }

  async bulkSoftDelete(ids: string[]): Promise<{ success: boolean; modifiedCount: number }> {
    const validIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const result = await this.orderModel.updateMany(
      { _id: { $in: validIds }, deleted: false },
      { $set: { deleted: true } },
    );
    return { success: true, modifiedCount: result.modifiedCount };
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
