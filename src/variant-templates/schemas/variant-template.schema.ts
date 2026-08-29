import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VariantTemplateDocument = VariantTemplate & Document;

@Schema({ timestamps: true })
export class VariantTemplate {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true, default: '' })
  titleEn?: string;

  @Prop({ required: true, min: 0 })
  defaultPrice!: number;

  @Prop({ min: 0, default: null })
  defaultDiscountPrice?: number | null;

  @Prop({ default: 10, min: 0 })
  defaultStock!: number;

  @Prop({ trim: true, default: 'میل' })
  unit?: string;

  @Prop({ default: true })
  isPopular!: boolean;

  @Prop({ default: 0 })
  order!: number;

  @Prop({ default: false })
  deleted!: boolean;
}

export const VariantTemplateSchema = SchemaFactory.createForClass(VariantTemplate);
VariantTemplateSchema.index({ order: 1 });
VariantTemplateSchema.index({ deleted: 1 });
