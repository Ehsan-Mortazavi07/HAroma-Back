import { Document, Types } from 'mongoose';
export type ProductDocument = Product & Document;
export declare class ProductAttributeValue {
    attributeId?: Types.ObjectId;
    key: string;
    name: string;
    value: string;
    unit?: string;
}
export declare const ProductAttributeValueSchema: import("mongoose").Schema<ProductAttributeValue, import("mongoose").Model<ProductAttributeValue, any, any, any, Document<unknown, any, ProductAttributeValue, any, {}> & ProductAttributeValue & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ProductAttributeValue, Document<unknown, {}, import("mongoose").FlatRecord<ProductAttributeValue>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ProductAttributeValue> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class ProductVariant {
    id: string;
    title: string;
    titleEn?: string;
    price: number;
    discountPrice?: number | null;
    stockCount: number;
    inStock: boolean;
    isDefault?: boolean;
}
export declare const ProductVariantSchema: import("mongoose").Schema<ProductVariant, import("mongoose").Model<ProductVariant, any, any, any, Document<unknown, any, ProductVariant, any, {}> & ProductVariant & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ProductVariant, Document<unknown, {}, import("mongoose").FlatRecord<ProductVariant>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ProductVariant> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class Product {
    title: string;
    titleEn?: string;
    slug: string;
    description: string;
    descriptionEn?: string;
    shortDescription?: string;
    shortDescriptionEn?: string;
    price: number;
    discountPrice?: number | null;
    images: string[];
    categories: Types.ObjectId[];
    attributes: ProductAttributeValue[];
    variants: ProductVariant[];
    stockCount: number;
    inStock: boolean;
    isVipOnly: boolean;
    rating: number;
    reviewCount: number;
    salesCount: number;
    isFeatured: boolean;
    deleted: boolean;
}
export declare const ProductSchema: import("mongoose").Schema<Product, import("mongoose").Model<Product, any, any, any, Document<unknown, any, Product, any, {}> & Product & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Product, Document<unknown, {}, import("mongoose").FlatRecord<Product>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Product> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
