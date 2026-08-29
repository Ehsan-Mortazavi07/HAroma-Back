import { VariantTemplatesService } from './variant-templates.service';
import { CreateVariantTemplateDto, UpdateVariantTemplateDto } from './dtos';
export declare class VariantTemplatesController {
    private readonly variantTemplatesService;
    constructor(variantTemplatesService: VariantTemplatesService);
    getPublicTemplates(): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/variant-template.schema").VariantTemplateDocument, {}, {}> & import("./schemas/variant-template.schema").VariantTemplate & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    adminListTemplates(): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/variant-template.schema").VariantTemplateDocument, {}, {}> & import("./schemas/variant-template.schema").VariantTemplate & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    adminGetTemplate(id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/variant-template.schema").VariantTemplateDocument, {}, {}> & import("./schemas/variant-template.schema").VariantTemplate & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    createTemplate(dto: CreateVariantTemplateDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/variant-template.schema").VariantTemplateDocument, {}, {}> & import("./schemas/variant-template.schema").VariantTemplate & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    updateTemplate(id: string, dto: UpdateVariantTemplateDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/variant-template.schema").VariantTemplateDocument, {}, {}> & import("./schemas/variant-template.schema").VariantTemplate & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    deleteTemplate(id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/variant-template.schema").VariantTemplateDocument, {}, {}> & import("./schemas/variant-template.schema").VariantTemplate & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
}
