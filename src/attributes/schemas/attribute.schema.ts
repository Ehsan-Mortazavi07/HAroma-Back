import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AttributeDocument = Attribute & Document;

@Schema({ timestamps: true })
export class Attribute {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true, default: '' })
  nameEn?: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  key!: string;

  @Prop({ type: [String], default: [] })
  possibleValues!: string[];

  @Prop({ trim: true, default: '' })
  unit?: string;

  @Prop({ default: false })
  deleted!: boolean;
}

export const AttributeSchema = SchemaFactory.createForClass(Attribute);
AttributeSchema.index({ key: 1 });
AttributeSchema.index({ deleted: 1 });
