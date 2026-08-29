export declare class CreateVipPlanDto {
    title: string;
    titleEn?: string;
    description?: string;
    descriptionEn?: string;
    price: number;
    durationDays: number;
    discountPercent?: number;
    perks?: string[];
    perksEn?: string[];
    badgeColor?: string;
    isPopular?: boolean;
    isActive?: boolean;
}
export declare class UpdateVipPlanDto {
    title?: string;
    titleEn?: string;
    description?: string;
    descriptionEn?: string;
    price?: number;
    durationDays?: number;
    discountPercent?: number;
    perks?: string[];
    perksEn?: string[];
    badgeColor?: string;
    isPopular?: boolean;
    isActive?: boolean;
}
