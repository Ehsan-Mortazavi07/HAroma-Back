import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true, default: '' })
  nameEn?: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null, required: false })
  parentId?: Types.ObjectId | null;

  @Prop({ default: '' })
  description?: string;

  @Prop({ default: '' })
  image?: string;

  @Prop({ default: '' })
  icon?: string;

  @Prop({ default: 0 })
  order!: number;

  @Prop({ default: true })
  isFeatured!: boolean;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  deleted!: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ slug: 1 });
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ deleted: 1 });
CategorySchema.index({ order: 1 });
