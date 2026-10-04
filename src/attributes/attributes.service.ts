import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attribute, AttributeDocument } from './schemas/attribute.schema';
import { CreateAttributeDto, QuickCreateAttributeDto, UpdateAttributeDto } from './dtos';
import { normalizeSearchQuery } from '../common/utils/search.util';

@Injectable()
export class AttributesService {
  constructor(
    @InjectModel(Attribute.name) private attributeModel: Model<AttributeDocument>,
  ) {}

  async create(createDto: CreateAttributeDto): Promise<AttributeDocument> {
    const key = createDto.key.toLowerCase().trim().replace(/[\s-]+/g, '_');
    const existing = await this.attributeModel.findOne({ key, deleted: false });
    if (existing) {
      throw new ConflictException('ویژگی با این کلید از قبل وجود دارد.');
    }

    const attribute = new this.attributeModel({
      ...createDto,
      key,
    });
    return attribute.save();
  }

  async quickCreate(dto: QuickCreateAttributeDto): Promise<AttributeDocument> {
    // Generate slug/key from name or timestamp
    let generatedKey = dto.name
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_')
      .replace(/_+/g, '_');

    if (!generatedKey || generatedKey.length < 2) {
      generatedKey = `attr_${Date.now()}`;
    }

    let key = generatedKey;
    let counter = 1;
    while (await this.attributeModel.findOne({ key, deleted: false })) {
      key = `${generatedKey}_${counter}`;
      counter++;
    }

    const possibleValues = dto.value ? [dto.value.trim()] : [];

    const attribute = new this.attributeModel({
      name: dto.name.trim(),
      key,
      possibleValues,
      unit: dto.unit || '',
    });

    return attribute.save();
  }

  async findAll(query?: { q?: string }) {
    const filter: any = { deleted: false };
    const searchQuery = normalizeSearchQuery(query?.q, 100);
    if (searchQuery) {
      filter.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { nameEn: { $regex: searchQuery, $options: 'i' } },
        { key: { $regex: searchQuery, $options: 'i' } },
      ];
    }
    return this.attributeModel.find(filter).sort({ createdAt: 1 }).exec();
  }

  async findById(id: string): Promise<AttributeDocument> {
    const attribute = await this.attributeModel.findOne({ _id: id, deleted: false }).exec();
    if (!attribute) {
      throw new NotFoundException('ویژگی مورد نظر یافت نشد.');
    }
    return attribute;
  }

  async update(id: string, updateDto: UpdateAttributeDto): Promise<AttributeDocument> {
    const attribute = await this.findById(id);

    if (updateDto.key && updateDto.key !== attribute.key) {
      const key = updateDto.key.toLowerCase().trim().replace(/[\s-]+/g, '_');
      const existing = await this.attributeModel.findOne({
        key,
        _id: { $ne: id },
        deleted: false,
      });
      if (existing) {
        throw new ConflictException('ویژگی دیگری با این کلید وجود دارد.');
      }
      updateDto.key = key;
    }

    const updated = await this.attributeModel
      .findOneAndUpdate(
        { _id: id, deleted: false },
        { $set: updateDto },
        { new: true, runValidators: false },
      )
      .exec();
    if (!updated) throw new NotFoundException('ویژگی مورد نظر یافت نشد.');
    return updated;
  }

  async addPossibleValue(id: string, value: string): Promise<AttributeDocument> {
    const attribute = await this.findById(id);
    const cleanVal = value.trim();
    if (cleanVal && !attribute.possibleValues.includes(cleanVal)) {
      attribute.possibleValues.push(cleanVal);
      await attribute.save();
    }
    return attribute;
  }

  async softDelete(id: string): Promise<{ success: boolean; message: string }> {
    const attribute = await this.findById(id);
    await this.attributeModel.updateOne({ _id: attribute._id }, { $set: { deleted: true } });
    return { success: true, message: 'ویژگی با موفقیت حذف شد.' };
  }

  async bulkSoftDelete(ids: string[]): Promise<{ success: boolean; modifiedCount: number }> {
    const validIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const result = await this.attributeModel.updateMany(
      { _id: { $in: validIds }, deleted: false },
      { $set: { deleted: true } },
    );
    return { success: true, modifiedCount: result.modifiedCount };
  }
}
