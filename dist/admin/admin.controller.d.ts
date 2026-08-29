import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from '../categories/categories.service';
import { AttributesService } from '../attributes/attributes.service';
import { OrdersService } from '../orders/orders.service';
import { CouponsService } from '../coupons/coupons.service';
import { VipPlansService } from '../vip-plans/vip-plans.service';
import { PageSectionsService } from '../page-sections/page-sections.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from '../products/dtos';
import { CreateCategoryDto, UpdateCategoryDto } from '../categories/dtos';
import { CreateAttributeDto, UpdateAttributeDto, QuickCreateAttributeDto } from '../attributes/dtos';
import { CreateCouponDto } from '../coupons/dtos';
import { CreateVipPlanDto, UpdateVipPlanDto } from '../vip-plans/dtos';
import { UpdatePageSectionDto } from '../page-sections/dtos';
import { CreateUserDto, UpdateUserDto, UpdateUserRoleDto, UpdateUserVipDto } from '../users/dtos';
import { OrderStatus } from '../common/enums';
export declare class AdminController {
    private readonly usersService;
    private readonly productsService;
    private readonly categoriesService;
    private readonly attributesService;
    private readonly ordersService;
    private readonly couponsService;
    private readonly vipPlansService;
    private readonly pageSectionsService;
    private readonly uploadsService;
    constructor(usersService: UsersService, productsService: ProductsService, categoriesService: CategoriesService, attributesService: AttributesService, ordersService: OrdersService, couponsService: CouponsService, vipPlansService: VipPlansService, pageSectionsService: PageSectionsService, uploadsService: UploadsService);
    getDashboardStats(): Promise<{
        totalOrders: number;
        totalRevenue: any;
        pendingOrders: number;
    }>;
    getProducts(query: ProductQueryDto): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("../products/schemas/product.schema").ProductDocument, {}, {}> & import("../products/schemas/product.schema").Product & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    getProduct(id: string): Promise<import("../products/schemas/product.schema").ProductDocument>;
    createProduct(dto: CreateProductDto): Promise<import("../products/schemas/product.schema").ProductDocument>;
    updateProduct(id: string, dto: UpdateProductDto): Promise<import("../products/schemas/product.schema").ProductDocument>;
    deleteProduct(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getCategories(): Promise<(import("mongoose").Document<unknown, {}, import("../categories/schemas/category.schema").CategoryDocument, {}, {}> & import("../categories/schemas/category.schema").Category & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getCategory(id: string): Promise<import("../categories/schemas/category.schema").CategoryDocument>;
    createCategory(dto: CreateCategoryDto): Promise<import("../categories/schemas/category.schema").CategoryDocument>;
    updateCategory(id: string, dto: UpdateCategoryDto): Promise<import("../categories/schemas/category.schema").CategoryDocument>;
    deleteCategory(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAttributes(): Promise<(import("mongoose").Document<unknown, {}, import("../attributes/schemas/attribute.schema").AttributeDocument, {}, {}> & import("../attributes/schemas/attribute.schema").Attribute & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getAttribute(id: string): Promise<import("../attributes/schemas/attribute.schema").AttributeDocument>;
    createAttribute(dto: CreateAttributeDto): Promise<import("../attributes/schemas/attribute.schema").AttributeDocument>;
    quickCreateAttribute(dto: QuickCreateAttributeDto): Promise<import("../attributes/schemas/attribute.schema").AttributeDocument>;
    updateAttribute(id: string, dto: UpdateAttributeDto): Promise<import("../attributes/schemas/attribute.schema").AttributeDocument>;
    deleteAttribute(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getOrders(page?: number, pageSize?: number, status?: OrderStatus, q?: string): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("../orders/schemas/order.schema").OrderDocument, {}, {}> & import("../orders/schemas/order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    getOrder(id: string): Promise<import("../orders/schemas/order.schema").OrderDocument>;
    updateOrderStatus(id: string, status: OrderStatus, trackingCode?: string): Promise<import("../orders/schemas/order.schema").OrderDocument>;
    getCoupons(): Promise<(import("mongoose").Document<unknown, {}, import("../coupons/schemas/coupon.schema").CouponDocument, {}, {}> & import("../coupons/schemas/coupon.schema").Coupon & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    createCoupon(dto: CreateCouponDto): Promise<import("../coupons/schemas/coupon.schema").CouponDocument>;
    updateCoupon(id: string, dto: Partial<CreateCouponDto>): Promise<import("../coupons/schemas/coupon.schema").CouponDocument>;
    deleteCoupon(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getVipPlans(): Promise<(import("mongoose").Document<unknown, {}, import("../vip-plans/schemas/vip-plan.schema").VipPlanDocument, {}, {}> & import("../vip-plans/schemas/vip-plan.schema").VipPlan & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    createVipPlan(dto: CreateVipPlanDto): Promise<import("../vip-plans/schemas/vip-plan.schema").VipPlanDocument>;
    updateVipPlan(id: string, dto: UpdateVipPlanDto): Promise<import("../vip-plans/schemas/vip-plan.schema").VipPlanDocument>;
    deleteVipPlan(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getUsers(page?: number, pageSize?: number, q?: string, role?: string): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("../users/schemas/user.schema").UserDocument, {}, {}> & import("../users/schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    getUser(id: string): Promise<import("../users/schemas/user.schema").UserDocument>;
    createUser(dto: CreateUserDto): Promise<import("../users/schemas/user.schema").UserDocument>;
    updateUser(id: string, dto: UpdateUserDto): Promise<import("../users/schemas/user.schema").UserDocument>;
    updateUserRole(id: string, dto: UpdateUserRoleDto): Promise<import("../users/schemas/user.schema").UserDocument>;
    updateUserVip(id: string, dto: UpdateUserVipDto): Promise<import("../users/schemas/user.schema").UserDocument>;
    deleteUser(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getPageSections(): Promise<(import("mongoose").Document<unknown, {}, import("../page-sections/schemas/page-section.schema").PageSectionDocument, {}, {}> & import("../page-sections/schemas/page-section.schema").PageSection & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    updatePageSection(key: string, dto: UpdatePageSectionDto): Promise<import("../page-sections/schemas/page-section.schema").PageSectionDocument>;
    toggleSectionVip(key: string, isVipOnly: boolean): Promise<import("../page-sections/schemas/page-section.schema").PageSectionDocument>;
    toggleSectionVisibility(key: string, isVisible: boolean): Promise<import("../page-sections/schemas/page-section.schema").PageSectionDocument>;
    uploadImage(file: Express.Multer.File): Promise<{
        path: string;
        url: string;
        filename: string;
    }>;
}
