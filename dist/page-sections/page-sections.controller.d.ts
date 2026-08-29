import { PageSectionsService } from './page-sections.service';
import { UpdatePageSectionDto } from './dtos';
export declare class PageSectionsController {
    private readonly pageSectionsService;
    constructor(pageSectionsService: PageSectionsService);
    getPublicSections(): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/page-section.schema").PageSectionDocument, {}, {}> & import("./schemas/page-section.schema").PageSection & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    adminListSections(): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/page-section.schema").PageSectionDocument, {}, {}> & import("./schemas/page-section.schema").PageSection & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    updateSection(sectionKey: string, dto: UpdatePageSectionDto): Promise<import("./schemas/page-section.schema").PageSectionDocument>;
    toggleVip(sectionKey: string, isVipOnly: boolean): Promise<import("./schemas/page-section.schema").PageSectionDocument>;
    toggleVisibility(sectionKey: string, isVisible: boolean): Promise<import("./schemas/page-section.schema").PageSectionDocument>;
}
