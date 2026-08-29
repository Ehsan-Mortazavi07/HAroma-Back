import { Document } from 'mongoose';
export type PageSectionDocument = PageSection & Document;
export declare class SectionBanner {
    imageUrl: string;
    link: string;
    title?: string;
    subtitle?: string;
    badge?: string;
    bgGradient?: string;
}
export declare const SectionBannerSchema: import("mongoose").Schema<SectionBanner, import("mongoose").Model<SectionBanner, any, any, any, Document<unknown, any, SectionBanner, any, {}> & SectionBanner & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, SectionBanner, Document<unknown, {}, import("mongoose").FlatRecord<SectionBanner>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<SectionBanner> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare class PageSection {
    sectionKey: string;
    title: string;
    titleEn?: string;
    subtitle?: string;
    isVisible: boolean;
    isVipOnly: boolean;
    order: number;
    banners: SectionBanner[];
    config?: Record<string, any>;
    deleted: boolean;
}
export declare const PageSectionSchema: import("mongoose").Schema<PageSection, import("mongoose").Model<PageSection, any, any, any, Document<unknown, any, PageSection, any, {}> & PageSection & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PageSection, Document<unknown, {}, import("mongoose").FlatRecord<PageSection>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<PageSection> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
