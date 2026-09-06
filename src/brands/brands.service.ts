import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand, BrandDocument } from './schemas/brand.schema';
import { CreateBrandDto, UpdateBrandDto } from './dtos';

@Injectable()
export class BrandsService {
  constructor(
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
  ) {}

  async create(createBrandDto: CreateBrandDto): Promise<BrandDocument> {
    const existing = await this.brandModel.findOne({
      slug: createBrandDto.slug.toLowerCase(),
      deleted: false,
    });
    if (existing) {
      throw new ConflictException('برند دیگری با این اسلاگ از قبل وجود دارد.');
    }

    const brand = new this.brandModel({
      ...createBrandDto,
      slug: createBrandDto.slug.toLowerCase(),
    });
    return brand.save();
  }

  async findAll(query?: { q?: string; featuredOnly?: boolean }) {
    const filter: any = { deleted: false };
    if (query?.q) {
      filter.$or = [
        { name: { $regex: query.q, $options: 'i' } },
        { nameEn: { $regex: query.q, $options: 'i' } },
        { slug: { $regex: query.q, $options: 'i' } },
      ];
    }
    if (query?.featuredOnly) {
      filter.isFeatured = true;
    }

    return this.brandModel.find(filter).sort({ order: 1, createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<BrandDocument> {
    const brand = await this.brandModel.findOne({ _id: id, deleted: false }).exec();
    if (!brand) {
      throw new NotFoundException('برند مورد نظر یافت نشد.');
    }
    return brand;
  }

  async findBySlug(slug: string): Promise<BrandDocument> {
    const brand = await this.brandModel.findOne({
      slug: slug.toLowerCase(),
      deleted: false,
    }).exec();
    if (!brand) {
      throw new NotFoundException('برند مورد نظر یافت نشد.');
    }
    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto): Promise<BrandDocument> {
    const brand = await this.findById(id);
    if (updateBrandDto.slug && updateBrandDto.slug !== brand.slug) {
      const existing = await this.brandModel.findOne({
        slug: updateBrandDto.slug.toLowerCase(),
        _id: { $ne: id },
        deleted: false,
      });
      if (existing) {
        throw new ConflictException('برند دیگری با این اسلاگ وجود دارد.');
      }
      updateBrandDto.slug = updateBrandDto.slug.toLowerCase();
    }

    Object.assign(brand, updateBrandDto);
    return brand.save();
  }

  async softDelete(id: string): Promise<{ success: boolean; message: string }> {
    const brand = await this.findById(id);
    brand.deleted = true;
    await brand.save();
    return { success: true, message: 'برند با موفقیت حذف گردید.' };
  }
}
