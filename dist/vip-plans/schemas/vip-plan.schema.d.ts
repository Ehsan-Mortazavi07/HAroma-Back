import { Document } from 'mongoose';
export type VipPlanDocument = VipPlan & Document;
export declare class VipPlan {
    title: string;
    titleEn?: string;
    description?: string;
    descriptionEn?: string;
    price: number;
    durationDays: number;
    discountPercent: number;
    perks: string[];
    perksEn?: string[];
    badgeColor?: string;
    isPopular: boolean;
    isActive: boolean;
    deleted: boolean;
}
export declare const VipPlanSchema: import("mongoose").Schema<VipPlan, import("mongoose").Model<VipPlan, any, any, any, Document<unknown, any, VipPlan, any, {}> & VipPlan & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, VipPlan, Document<unknown, {}, import("mongoose").FlatRecord<VipPlan>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<VipPlan> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
