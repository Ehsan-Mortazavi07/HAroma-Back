import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Category } from '../../categories/schemas/category.schema';
import { Attribute } from '../../attributes/schemas/attribute.schema';
import { Brand } from '../../brands/schemas/brand.schema';

export type ProductDocument = Product & Document;

@Schema({ _id: false })
export class ProductAttributeValue {
  @Prop({ type: Types.ObjectId, ref: Attribute.name, required: false })
  attributeId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  key!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  value!: string;

  @Prop({ type: [String], default: [] })
  values?: string[];

  @Prop({ trim: true, default: '' })
  unit?: string;
}

export const ProductAttributeValueSchema = SchemaFactory.createForClass(ProductAttributeValue);

@Schema({ _id: false })
export class ProductVariant {
  @Prop({ required: true, trim: true })
  id!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true, default: '' })
  titleEn?: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ min: 0, default: null })
  discountPrice?: number | null;

  @Prop({ default: 10, min: 0 })
  stockCount!: number;

  @Prop({ default: true })
  inStock!: boolean;

  @Prop({ default: false })
  isDefault?: boolean;
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true, default: '' })
  titleEn?: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ default: '' })
  descriptionEn?: string;

  @Prop({ default: '' })
  shortDescription?: string;

  @Prop({ default: '' })
  shortDescriptionEn?: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ min: 0, default: null })
  discountPrice?: number | null;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: Category.name }],
    default: [],
  })
  categories!: Types.ObjectId[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: Brand.name }],
    default: [],
  })
  brands!: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: Brand.name, default: null, required: false })
  brand?: Types.ObjectId | null;

  @Prop({
    type: [ProductAttributeValueSchema],
    default: [],
  })
  attributes!: ProductAttributeValue[];

  @Prop({
    type: [ProductVariantSchema],
    default: [],
  })
  variants!: ProductVariant[];

  @Prop({ default: 10 })
  stockCount!: number;

  @Prop({ default: true })
  inStock!: boolean;

  @Prop({ default: false })
  isVipOnly!: boolean;

  @Prop({ default: 4.8 })
  rating!: number;

  @Prop({ default: 15 })
  reviewCount!: number;

  @Prop({ default: 0 })
  salesCount!: number;

  @Prop({ default: false })
  isFeatured!: boolean;

  @Prop({ default: true })
  isPublished!: boolean;

  @Prop({ default: false })
  deleted!: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ slug: 1 });
ProductSchema.index({ categories: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ brands: 1 });
ProductSchema.index({ isVipOnly: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ isPublished: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ deleted: 1 });
ProductSchema.index({ createdAt: -1 });
