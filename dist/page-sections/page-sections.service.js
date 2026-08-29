"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageSectionsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const page_section_schema_1 = require("./schemas/page-section.schema");
let PageSectionsService = class PageSectionsService {
    pageSectionModel;
    constructor(pageSectionModel) {
        this.pageSectionModel = pageSectionModel;
    }
    async findAll(isVipUser = false) {
        const filter = { deleted: false, isVisible: true };
        if (!isVipUser) {
        }
        return this.pageSectionModel.find(filter).sort({ order: 1 }).exec();
    }
    async adminFindAll() {
        return this.pageSectionModel.find({ deleted: false }).sort({ order: 1 }).exec();
    }
    async findByKey(sectionKey) {
        const section = await this.pageSectionModel
            .findOne({ sectionKey, deleted: false })
            .exec();
        if (!section) {
            throw new common_1.NotFoundException('بخش مورد نظر یافت نشد.');
        }
        return section;
    }
    async updateByKey(sectionKey, dto) {
        let section = await this.pageSectionModel.findOne({ sectionKey, deleted: false });
        if (!section) {
            section = new this.pageSectionModel({
                sectionKey,
                title: dto.title || sectionKey,
                ...dto,
            });
        }
        else {
            Object.assign(section, dto);
        }
        return section.save();
    }
    async toggleVipOnly(sectionKey, isVipOnly) {
        const section = await this.findByKey(sectionKey);
        section.isVipOnly = isVipOnly;
        return section.save();
    }
    async toggleVisibility(sectionKey, isVisible) {
        const section = await this.findByKey(sectionKey);
        section.isVisible = isVisible;
        return section.save();
    }
};
exports.PageSectionsService = PageSectionsService;
exports.PageSectionsService = PageSectionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(page_section_schema_1.PageSection.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], PageSectionsService);
//# sourceMappingURL=page-sections.service.js.map