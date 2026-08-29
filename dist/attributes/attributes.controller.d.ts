import { AttributesService } from './attributes.service';
import { CreateAttributeDto, QuickCreateAttributeDto, UpdateAttributeDto } from './dtos';
export declare class AttributesController {
    private readonly attributesService;
    constructor(attributesService: AttributesService);
    getAllAttributes(q?: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/attribute.schema").AttributeDocument, {}, {}> & import("./schemas/attribute.schema").Attribute & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getAttributeById(id: string): Promise<import("./schemas/attribute.schema").AttributeDocument>;
    adminListAttributes(q?: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/attribute.schema").AttributeDocument, {}, {}> & import("./schemas/attribute.schema").Attribute & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    adminCreateAttribute(dto: CreateAttributeDto): Promise<import("./schemas/attribute.schema").AttributeDocument>;
    adminQuickCreateAttribute(dto: QuickCreateAttributeDto): Promise<import("./schemas/attribute.schema").AttributeDocument>;
    adminUpdateAttribute(id: string, dto: UpdateAttributeDto): Promise<import("./schemas/attribute.schema").AttributeDocument>;
    adminDeleteAttribute(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
