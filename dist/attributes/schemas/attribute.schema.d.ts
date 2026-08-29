import { Document } from 'mongoose';
export type AttributeDocument = Attribute & Document;
export declare class Attribute {
    name: string;
    nameEn?: string;
    key: string;
    possibleValues: string[];
    unit?: string;
    deleted: boolean;
}
export declare const AttributeSchema: import("mongoose").Schema<Attribute, import("mongoose").Model<Attribute, any, any, any, Document<unknown, any, Attribute, any, {}> & Attribute & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Attribute, Document<unknown, {}, import("mongoose").FlatRecord<Attribute>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Attribute> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
