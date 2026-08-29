export declare class ProductAttributeInputDto {
    attributeId?: string;
    key: string;
    name: string;
    value: string;
    unit?: string;
}
export declare class ProductVariantDto {
    id: string;
    title: string;
    titleEn?: string;
    price: number;
    discountPrice?: number;
    stockCount?: number;
    inStock?: boolean;
    isDefault?: boolean;
}
export declare class CreateProductDto {
    title: string;
    titleEn?: string;
    slug: string;
    description: string;
    descriptionEn?: string;
    shortDescription?: string;
    shortDescriptionEn?: string;
    price: number;
    discountPrice?: number;
    images?: string[];
    categories?: string[];
    attributes?: ProductAttributeInputDto[];
    variants?: ProductVariantDto[];
    stockCount?: number;
    inStock?: boolean;
    isVipOnly?: boolean;
    isFeatured?: boolean;
}
export declare class UpdateProductDto {
    title?: string;
    titleEn?: string;
    slug?: string;
    description?: string;
    descriptionEn?: string;
    shortDescription?: string;
    shortDescriptionEn?: string;
    price?: number;
    discountPrice?: number;
    images?: string[];
    categories?: string[];
    attributes?: ProductAttributeInputDto[];
    variants?: ProductVariantDto[];
    stockCount?: number;
    inStock?: boolean;
    isVipOnly?: boolean;
    isFeatured?: boolean;
}
export declare class ProductQueryDto {
    page?: number;
    pageSize?: number;
    q?: string;
    category?: string;
    isVipOnly?: string;
    isFeatured?: string;
    sort?: 'newest' | 'cheapest' | 'expensive' | 'popular' | 'bestseller';
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: string;
}
