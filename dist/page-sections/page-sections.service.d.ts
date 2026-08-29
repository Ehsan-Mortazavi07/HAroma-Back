import { Model } from 'mongoose';
import { PageSection, PageSectionDocument } from './schemas/page-section.schema';
import { UpdatePageSectionDto } from './dtos';
export declare class PageSectionsService {
    private pageSectionModel;
    constructor(pageSectionModel: Model<PageSectionDocument>);
    findAll(isVipUser?: boolean): Promise<(import("mongoose").Document<unknown, {}, PageSectionDocument, {}, {}> & PageSection & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    adminFindAll(): Promise<(import("mongoose").Document<unknown, {}, PageSectionDocument, {}, {}> & PageSection & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    findByKey(sectionKey: string): Promise<PageSectionDocument>;
    updateByKey(sectionKey: string, dto: UpdatePageSectionDto): Promise<PageSectionDocument>;
    toggleVipOnly(sectionKey: string, isVipOnly: boolean): Promise<PageSectionDocument>;
    toggleVisibility(sectionKey: string, isVisible: boolean): Promise<PageSectionDocument>;
}
