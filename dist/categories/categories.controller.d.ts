import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dtos';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    getAllCategories(q?: string, featuredOnly?: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/category.schema").CategoryDocument, {}, {}> & import("./schemas/category.schema").Category & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getCategoryBySlug(slug: string): Promise<import("./schemas/category.schema").CategoryDocument>;
    adminListCategories(q?: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/category.schema").CategoryDocument, {}, {}> & import("./schemas/category.schema").Category & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    adminGetCategory(id: string): Promise<import("./schemas/category.schema").CategoryDocument>;
    adminCreateCategory(dto: CreateCategoryDto): Promise<import("./schemas/category.schema").CategoryDocument>;
    adminUpdateCategory(id: string, dto: UpdateCategoryDto): Promise<import("./schemas/category.schema").CategoryDocument>;
    adminDeleteCategory(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
