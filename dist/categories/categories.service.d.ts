import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dtos';
export declare class CategoriesService {
    private categoryModel;
    constructor(categoryModel: Model<CategoryDocument>);
    create(createCategoryDto: CreateCategoryDto): Promise<CategoryDocument>;
    findAll(query?: {
        q?: string;
        featuredOnly?: boolean;
    }): Promise<(import("mongoose").Document<unknown, {}, CategoryDocument, {}, {}> & Category & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    findById(id: string): Promise<CategoryDocument>;
    findBySlug(slug: string): Promise<CategoryDocument>;
    update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDocument>;
    softDelete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
