import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VariantTemplate, VariantTemplateDocument } from './schemas/variant-template.schema';
import { CreateVariantTemplateDto, UpdateVariantTemplateDto } from './dtos';

@Injectable()
export class VariantTemplatesService {
  constructor(
    @InjectModel(VariantTemplate.name)
    private variantTemplateModel: Model<VariantTemplateDocument>,
  ) {}

  async findAll() {
    return this.variantTemplateModel
      .find({ deleted: false })
      .sort({ order: 1, createdAt: 1 })
      .exec();
  }

  async findOne(id: string) {
    const template = await this.variantTemplateModel.findOne({ _id: id, deleted: false }).exec();
    if (!template) {
      throw new NotFoundException('الگوی تنوع یافت نشد.');
    }
    return template;
  }

  async create(dto: CreateVariantTemplateDto) {
    const template = new this.variantTemplateModel({
      ...dto,
      defaultStock: dto.defaultStock !== undefined ? dto.defaultStock : 10,
      unit: dto.unit || 'میل',
      isPopular: dto.isPopular !== undefined ? dto.isPopular : true,
      order: dto.order !== undefined ? dto.order : 0,
      deleted: false,
    });
    return template.save();
  }

  async update(id: string, dto: UpdateVariantTemplateDto) {
    const template = await this.variantTemplateModel
      .findOneAndUpdate(
        { _id: id, deleted: false },
        { $set: dto },
        { new: true, runValidators: false },
      )
      .exec();
    if (!template) {
      throw new NotFoundException('الگوی تنوع مورد نظر یافت نشد.');
    }
    return template;
  }

  async remove(id: string) {
    const template = await this.findOne(id);
    template.deleted = true;
    return template.save();
  }
}
