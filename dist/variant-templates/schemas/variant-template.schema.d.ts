import { Document } from 'mongoose';
export type VariantTemplateDocument = VariantTemplate & Document;
export declare class VariantTemplate {
    title: string;
    titleEn?: string;
    defaultPrice: number;
    defaultDiscountPrice?: number | null;
    defaultStock: number;
    unit?: string;
    isPopular: boolean;
    order: number;
    deleted: boolean;
}
export declare const VariantTemplateSchema: import("mongoose").Schema<VariantTemplate, import("mongoose").Model<VariantTemplate, any, any, any, Document<unknown, any, VariantTemplate, any, {}> & VariantTemplate & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, VariantTemplate, Document<unknown, {}, import("mongoose").FlatRecord<VariantTemplate>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<VariantTemplate> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
