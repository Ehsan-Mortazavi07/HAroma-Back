import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dtos';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryDocument> {
    const existing = await this.categoryModel.findOne({
      slug: createCategoryDto.slug.toLowerCase(),
      deleted: false,
    });
    if (existing) {
      throw new ConflictException('دسته‌بندی با این اسلاگ از قبل وجود دارد.');
    }

    const category = new this.categoryModel({
      ...createCategoryDto,
      slug: createCategoryDto.slug.toLowerCase(),
    });
    return category.save();
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

    return this.categoryModel.find(filter).sort({ order: 1, createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<CategoryDocument> {
    const category = await this.categoryModel.findOne({ _id: id, deleted: false }).exec();
    if (!category) {
      throw new NotFoundException('دسته‌بندی مورد نظر یافت نشد.');
    }
    return category;
  }

  async findBySlug(slug: string): Promise<CategoryDocument> {
    const category = await this.categoryModel.findOne({
      slug: slug.toLowerCase(),
      deleted: false,
    }).exec();
    if (!category) {
      throw new NotFoundException('دسته‌بندی مورد نظر یافت نشد.');
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDocument> {
    const category = await this.findById(id);
    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existing = await this.categoryModel.findOne({
        slug: updateCategoryDto.slug.toLowerCase(),
        _id: { $ne: id },
        deleted: false,
      });
      if (existing) {
        throw new ConflictException('دسته‌بندی دیگری با این اسلاگ وجود دارد.');
      }
      updateCategoryDto.slug = updateCategoryDto.slug.toLowerCase();
    }

    Object.assign(category, updateCategoryDto);
    return category.save();
  }

  async softDelete(id: string): Promise<{ success: boolean; message: string }> {
    const category = await this.findById(id);
    category.deleted = true;
    await category.save();
    return { success: true, message: 'دسته‌بندی با موفقیت حذف شد.' };
  }
}
