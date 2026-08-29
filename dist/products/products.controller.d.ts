import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dtos';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    getAllProducts(query: ProductQueryDto): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("./schemas/product.schema").ProductDocument, {}, {}> & import("./schemas/product.schema").Product & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    getFeaturedProducts(limit?: number): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/product.schema").ProductDocument, {}, {}> & import("./schemas/product.schema").Product & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getBestSellers(limit?: number): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/product.schema").ProductDocument, {}, {}> & import("./schemas/product.schema").Product & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getVipExclusiveProducts(limit?: number): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/product.schema").ProductDocument, {}, {}> & import("./schemas/product.schema").Product & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getProductBySlug(slug: string): Promise<import("./schemas/product.schema").ProductDocument>;
    getRelatedProducts(id: string, limit?: number): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/product.schema").ProductDocument, {}, {}> & import("./schemas/product.schema").Product & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    adminListProducts(query: ProductQueryDto): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("./schemas/product.schema").ProductDocument, {}, {}> & import("./schemas/product.schema").Product & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    adminGetProduct(id: string): Promise<import("./schemas/product.schema").ProductDocument>;
    adminCreateProduct(dto: CreateProductDto): Promise<import("./schemas/product.schema").ProductDocument>;
    adminUpdateProduct(id: string, dto: UpdateProductDto): Promise<import("./schemas/product.schema").ProductDocument>;
    adminDeleteProduct(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
