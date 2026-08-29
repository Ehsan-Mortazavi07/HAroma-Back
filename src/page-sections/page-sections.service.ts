import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  async findByKey(sectionKey: string): Promise<PageSectionDocument> {
    const section = await this.pageSectionModel
      .findOne({ sectionKey, deleted: false })
      .exec();
    if (!section) {
      throw new NotFoundException('بخش مورد نظر یافت نشد.');
    }
    return section;
  }

  async updateByKey(
    sectionKey: string,
    dto: UpdatePageSectionDto,
  ): Promise<PageSectionDocument> {
    let section = await this.pageSectionModel.findOne({ sectionKey, deleted: false });
    if (!section) {
      section = new this.pageSectionModel({
        sectionKey,
        title: dto.title || sectionKey,
        ...dto,
      });
    } else {
      Object.assign(section, dto);
    }
    return section.save();
  }

  async toggleVipOnly(sectionKey: string, isVipOnly: boolean): Promise<PageSectionDocument> {
    const section = await this.findByKey(sectionKey);
    section.isVipOnly = isVipOnly;
    return section.save();
  }

  async toggleVisibility(sectionKey: string, isVisible: boolean): Promise<PageSectionDocument> {
    const section = await this.findByKey(sectionKey);
    section.isVisible = isVisible;
    return section.save();
  }
}
