import { Model } from 'mongoose';
import { VariantTemplate, VariantTemplateDocument } from './schemas/variant-template.schema';
import { CreateVariantTemplateDto, UpdateVariantTemplateDto } from './dtos';
export declare class VariantTemplatesService {
    private variantTemplateModel;
    constructor(variantTemplateModel: Model<VariantTemplateDocument>);
    findAll(): Promise<(import("mongoose").Document<unknown, {}, VariantTemplateDocument, {}, {}> & VariantTemplate & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, VariantTemplateDocument, {}, {}> & VariantTemplate & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    create(dto: CreateVariantTemplateDto): Promise<import("mongoose").Document<unknown, {}, VariantTemplateDocument, {}, {}> & VariantTemplate & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    update(id: string, dto: UpdateVariantTemplateDto): Promise<import("mongoose").Document<unknown, {}, VariantTemplateDocument, {}, {}> & VariantTemplate & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    remove(id: string): Promise<import("mongoose").Document<unknown, {}, VariantTemplateDocument, {}, {}> & VariantTemplate & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
}
