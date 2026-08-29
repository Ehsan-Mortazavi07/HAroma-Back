import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attribute, AttributeDocument } from './schemas/attribute.schema';
import { CreateAttributeDto, QuickCreateAttributeDto, UpdateAttributeDto } from './dtos';

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
    if (query?.q) {
      filter.$or = [
        { name: { $regex: query.q, $options: 'i' } },
        { nameEn: { $regex: query.q, $options: 'i' } },
        { key: { $regex: query.q, $options: 'i' } },
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

    Object.assign(attribute, updateDto);
    return attribute.save();
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
    attribute.deleted = true;
    await attribute.save();
    return { success: true, message: 'ویژگی با موفقیت حذف شد.' };
  }
}
