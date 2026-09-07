import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

    const parentId =
      createCategoryDto.parentId && Types.ObjectId.isValid(createCategoryDto.parentId)
        ? new Types.ObjectId(createCategoryDto.parentId)
        : null;

    const category = new this.categoryModel({
      ...createCategoryDto,
      slug: createCategoryDto.slug.toLowerCase(),
      parentId,
    });
    return category.save();
  }

  async findAll(query?: { q?: string; featuredOnly?: boolean; rootOnly?: boolean; includeInactive?: boolean }) {
    const filter: any = { deleted: false };
    if (!query?.includeInactive) {
      filter.isActive = { $ne: false };
    }
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
    if (query?.rootOnly) {
      filter.parentId = null;
    }

    return this.categoryModel
      .find(filter)
      .populate('parentId', 'name nameEn slug')
      .sort({ order: 1, createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<CategoryDocument> {
    const category = await this.categoryModel
      .findOne({ _id: id, deleted: false })
      .populate('parentId', 'name nameEn slug')
      .exec();
    if (!category) {
      throw new NotFoundException('دسته‌بندی مورد نظر یافت نشد.');
    }
    return category;
  }

  async findBySlug(slug: string): Promise<CategoryDocument> {
    const category = await this.categoryModel
      .findOne({
        slug: slug.toLowerCase(),
        deleted: false,
        isActive: { $ne: false },
      })
      .populate('parentId', 'name nameEn slug')
      .exec();
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

    const payload: any = { ...updateCategoryDto };
    if (updateCategoryDto.parentId !== undefined) {
      payload.parentId =
        updateCategoryDto.parentId && Types.ObjectId.isValid(updateCategoryDto.parentId)
          ? new Types.ObjectId(updateCategoryDto.parentId)
          : null;
    }

    Object.assign(category, payload);
    return category.save();
  }

  async softDelete(id: string): Promise<{ success: boolean; message: string }> {
    const category = await this.findById(id);
    category.deleted = true;
    await category.save();
    return { success: true, message: 'دسته‌بندی با موفقیت حذف شد.' };
  }
}
