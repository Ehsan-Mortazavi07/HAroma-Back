import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BrandDocument = Brand & Document;

@Schema({ timestamps: true })
export class Brand {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true, default: '' })
  nameEn?: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ default: '' })
  description?: string;

  @Prop({ default: '' })
  logo?: string;

  @Prop({ default: '' })
  image?: string;

  @Prop({ default: 0 })
  order!: number;

  @Prop({ default: true })
  isFeatured!: boolean;

  @Prop({ default: false })
  deleted!: boolean;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);
BrandSchema.index({ slug: 1 });
BrandSchema.index({ deleted: 1 });
BrandSchema.index({ order: 1 });
