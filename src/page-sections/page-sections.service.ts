import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PageSection, PageSectionDocument } from './schemas/page-section.schema';
import { UpdatePageSectionDto } from './dtos';

@Injectable()
export class PageSectionsService {
  constructor(
    @InjectModel(PageSection.name)
    private pageSectionModel: Model<PageSectionDocument>,
  ) {}

  async findAll(isVipUser = false) {
    const filter: any = { deleted: false, isVisible: true };
    if (!isVipUser) {
      // public users see non-VIP or marked sections
    }
    return this.pageSectionModel.find(filter).sort({ order: 1 }).exec();
  }

  async adminFindAll() {
    return this.pageSectionModel.find({ deleted: false }).sort({ order: 1 }).exec();
  }

  async findByKey(sectionKeyOrId: string): Promise<PageSectionDocument> {
    const isObjectId = Types.ObjectId.isValid(sectionKeyOrId);
    const section = await this.pageSectionModel
      .findOne({
        $or: [
          { sectionKey: sectionKeyOrId },
          ...(isObjectId ? [{ _id: new Types.ObjectId(sectionKeyOrId) }] : []),
        ],
        deleted: false,
      })
      .exec();
    if (!section) {
      throw new NotFoundException('بخش مورد نظر یافت نشد.');
    }
    return section;
  }

  async updateByKey(
    sectionKeyOrId: string,
    dto: UpdatePageSectionDto,
  ): Promise<PageSectionDocument> {
    const isObjectId = Types.ObjectId.isValid(sectionKeyOrId);
    let section = await this.pageSectionModel.findOne({
      $or: [
        { sectionKey: sectionKeyOrId },
        ...(isObjectId ? [{ _id: new Types.ObjectId(sectionKeyOrId) }] : []),
      ],
      deleted: false,
    });
    if (!section) {
      section = new this.pageSectionModel({
        sectionKey: sectionKeyOrId,
        title: dto.title || sectionKeyOrId,
        deleted: false,
        isVisible: dto.isVisible ?? true,
        isVipOnly: dto.isVipOnly ?? false,
        order: dto.order ?? 1,
        banners: dto.banners ?? [],
        config: dto.config ?? {},
      });
      if (dto.titleEn) section.titleEn = dto.titleEn;
      if (dto.subtitle) section.subtitle = dto.subtitle;
      if (dto.subtitleEn) section.subtitleEn = dto.subtitleEn;
    } else {
      if (dto.title !== undefined) section.title = dto.title;
      if (dto.titleEn !== undefined) section.titleEn = dto.titleEn;
      if (dto.subtitle !== undefined) section.subtitle = dto.subtitle;
      if (dto.subtitleEn !== undefined) section.subtitleEn = dto.subtitleEn;
      if (dto.isVisible !== undefined) section.isVisible = dto.isVisible;
      if (dto.isVipOnly !== undefined) section.isVipOnly = dto.isVipOnly;
      if (dto.order !== undefined) section.order = dto.order;
      if (dto.banners !== undefined) section.banners = dto.banners;
      if (dto.config !== undefined) section.config = dto.config;
    }
    return section.save();
  }

  async toggleVipOnly(sectionKeyOrId: string, isVipOnly: boolean): Promise<PageSectionDocument> {
    const section = await this.findByKey(sectionKeyOrId);
    section.isVipOnly = isVipOnly;
    return section.save();
  }

  async toggleVisibility(sectionKeyOrId: string, isVisible: boolean): Promise<PageSectionDocument> {
    const section = await this.findByKey(sectionKeyOrId);
    section.isVisible = isVisible;
    return section.save();
  }
}
