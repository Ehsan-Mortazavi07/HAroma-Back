import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dtos';
import { normalizeSearchQuery } from '../common/utils/search.util';

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
    const searchQuery = normalizeSearchQuery(query?.q, 100);
    if (searchQuery) {
      filter.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { nameEn: { $regex: searchQuery, $options: 'i' } },
        { slug: { $regex: searchQuery, $options: 'i' } },
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

    const updated = await this.categoryModel
      .findByIdAndUpdate(id, { $set: payload }, { new: true })
      .populate('parentId', 'name nameEn slug')
      .exec();
    if (!updated) {
      throw new NotFoundException('دسته‌بندی مورد نظر یافت نشد.');
    }
    return updated;
  }

  async softDelete(id: string): Promise<{ success: boolean; message: string }> {
    const category = await this.findById(id);
    await this.categoryModel.updateOne({ _id: category._id }, { $set: { deleted: true } });
    return { success: true, message: 'دسته‌بندی با موفقیت حذف شد.' };
  }

  async bulkUpdateStatus(
    ids: string[],
    isActive: boolean,
  ): Promise<{ success: boolean; modifiedCount: number }> {
    const validIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const result = await this.categoryModel.updateMany(
      { _id: { $in: validIds }, deleted: false },
      { $set: { isActive } },
    );
    return { success: true, modifiedCount: result.modifiedCount };
  }

  async bulkSoftDelete(ids: string[]): Promise<{ success: boolean; modifiedCount: number }> {
    const validIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const result = await this.categoryModel.updateMany(
      { _id: { $in: validIds }, deleted: false },
      { $set: { deleted: true } },
    );
    return { success: true, modifiedCount: result.modifiedCount };
  }
}
