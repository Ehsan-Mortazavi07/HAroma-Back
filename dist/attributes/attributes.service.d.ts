import { Model } from 'mongoose';
import { Attribute, AttributeDocument } from './schemas/attribute.schema';
import { CreateAttributeDto, QuickCreateAttributeDto, UpdateAttributeDto } from './dtos';
export declare class AttributesService {
    private attributeModel;
    constructor(attributeModel: Model<AttributeDocument>);
    create(createDto: CreateAttributeDto): Promise<AttributeDocument>;
    quickCreate(dto: QuickCreateAttributeDto): Promise<AttributeDocument>;
    findAll(query?: {
        q?: string;
    }): Promise<(import("mongoose").Document<unknown, {}, AttributeDocument, {}, {}> & Attribute & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    findById(id: string): Promise<AttributeDocument>;
    update(id: string, updateDto: UpdateAttributeDto): Promise<AttributeDocument>;
    addPossibleValue(id: string, value: string): Promise<AttributeDocument>;
    softDelete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
