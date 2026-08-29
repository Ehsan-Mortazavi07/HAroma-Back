export declare class CreateVariantTemplateDto {
    title: string;
    titleEn?: string;
    defaultPrice: number;
    defaultDiscountPrice?: number | null;
    defaultStock?: number;
    unit?: string;
    isPopular?: boolean;
    order?: number;
}
export declare class UpdateVariantTemplateDto {
    title?: string;
    titleEn?: string;
    defaultPrice?: number;
    defaultDiscountPrice?: number | null;
    defaultStock?: number;
    unit?: string;
    isPopular?: boolean;
    order?: number;
}
