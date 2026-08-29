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
exports.VariantTemplatesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const variant_template_schema_1 = require("./schemas/variant-template.schema");
let VariantTemplatesService = class VariantTemplatesService {
    variantTemplateModel;
    constructor(variantTemplateModel) {
        this.variantTemplateModel = variantTemplateModel;
    }
    async findAll() {
        return this.variantTemplateModel
            .find({ deleted: false })
            .sort({ order: 1, createdAt: 1 })
            .exec();
    }
    async findOne(id) {
        const template = await this.variantTemplateModel.findOne({ _id: id, deleted: false }).exec();
        if (!template) {
            throw new common_1.NotFoundException('الگوی تنوع یافت نشد.');
        }
        return template;
    }
    async create(dto) {
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
    async update(id, dto) {
        const template = await this.findOne(id);
        Object.assign(template, dto);
        return template.save();
    }
    async remove(id) {
        const template = await this.findOne(id);
        template.deleted = true;
        return template.save();
    }
};
exports.VariantTemplatesService = VariantTemplatesService;
exports.VariantTemplatesService = VariantTemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(variant_template_schema_1.VariantTemplate.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], VariantTemplatesService);
//# sourceMappingURL=variant-templates.service.js.map