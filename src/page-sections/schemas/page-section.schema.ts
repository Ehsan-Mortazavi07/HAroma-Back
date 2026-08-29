import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PageSectionDocument = PageSection & Document;

@Schema({ _id: false })
export class SectionBanner {
  @Prop({ required: true })
  imageUrl!: string;

  @Prop({ default: '/' })
  link!: string;

  @Prop({ default: '' })
  title?: string;

  @Prop({ default: '' })
  subtitle?: string;

  @Prop({ default: '' })
  badge?: string;

  @Prop({ default: '' })
  bgGradient?: string;
}

export const SectionBannerSchema = SchemaFactory.createForClass(SectionBanner);

@Schema({ timestamps: true })
export class PageSection {
  @Prop({ required: true, unique: true, trim: true })
  sectionKey!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true, default: '' })
  titleEn?: string;

  @Prop({ default: '' })
  subtitle?: string;

  @Prop({ default: true })
  isVisible!: boolean;

  @Prop({ default: false })
  isVipOnly!: boolean;

  @Prop({ default: 0 })
  order!: number;

  @Prop({ type: [SectionBannerSchema], default: [] })
  banners!: SectionBanner[];

  @Prop({ type: Object, default: {} })
  config?: Record<string, any>;

  @Prop({ default: false })
  deleted!: boolean;
}

export const PageSectionSchema = SchemaFactory.createForClass(PageSection);
PageSectionSchema.index({ sectionKey: 1 });
PageSectionSchema.index({ order: 1 });
PageSectionSchema.index({ isVisible: 1 });
