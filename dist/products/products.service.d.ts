import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dtos';
import { CategoryDocument } from '../categories/schemas/category.schema';
import { AttributesService } from '../attributes/attributes.service';
export declare class ProductsService {
    private productModel;
    private categoryModel;
    private attributesService;
    constructor(productModel: Model<ProductDocument>, categoryModel: Model<CategoryDocument>, attributesService: AttributesService);
    create(createProductDto: CreateProductDto): Promise<ProductDocument>;
    findAll(query: ProductQueryDto): Promise<{
        items: (import("mongoose").Document<unknown, {}, ProductDocument, {}, {}> & Product & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    findById(id: string): Promise<ProductDocument>;
    findBySlug(slug: string): Promise<ProductDocument>;
    getFeaturedProducts(limit?: number): Promise<(import("mongoose").Document<unknown, {}, ProductDocument, {}, {}> & Product & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getBestSellers(limit?: number): Promise<(import("mongoose").Document<unknown, {}, ProductDocument, {}, {}> & Product & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getVipExclusiveProducts(limit?: number): Promise<(import("mongoose").Document<unknown, {}, ProductDocument, {}, {}> & Product & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getRelatedProducts(productId: string, limit?: number): Promise<(import("mongoose").Document<unknown, {}, ProductDocument, {}, {}> & Product & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<ProductDocument>;
    softDelete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    countTotal(): Promise<number>;
}
