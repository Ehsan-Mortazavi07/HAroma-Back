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
exports.AttributesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const attribute_schema_1 = require("./schemas/attribute.schema");
let AttributesService = class AttributesService {
    attributeModel;
    constructor(attributeModel) {
        this.attributeModel = attributeModel;
    }
    async create(createDto) {
        const key = createDto.key.toLowerCase().trim().replace(/[\s-]+/g, '_');
        const existing = await this.attributeModel.findOne({ key, deleted: false });
        if (existing) {
            throw new common_1.ConflictException('ویژگی با این کلید از قبل وجود دارد.');
        }
        const attribute = new this.attributeModel({
            ...createDto,
            key,
        });
        return attribute.save();
    }
    async quickCreate(dto) {
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
    async findAll(query) {
        const filter = { deleted: false };
        if (query?.q) {
            filter.$or = [
                { name: { $regex: query.q, $options: 'i' } },
                { nameEn: { $regex: query.q, $options: 'i' } },
                { key: { $regex: query.q, $options: 'i' } },
            ];
        }
        return this.attributeModel.find(filter).sort({ createdAt: 1 }).exec();
    }
    async findById(id) {
        const attribute = await this.attributeModel.findOne({ _id: id, deleted: false }).exec();
        if (!attribute) {
            throw new common_1.NotFoundException('ویژگی مورد نظر یافت نشد.');
        }
        return attribute;
    }
    async update(id, updateDto) {
        const attribute = await this.findById(id);
        if (updateDto.key && updateDto.key !== attribute.key) {
            const key = updateDto.key.toLowerCase().trim().replace(/[\s-]+/g, '_');
            const existing = await this.attributeModel.findOne({
                key,
                _id: { $ne: id },
                deleted: false,
            });
            if (existing) {
                throw new common_1.ConflictException('ویژگی دیگری با این کلید وجود دارد.');
            }
            updateDto.key = key;
        }
        Object.assign(attribute, updateDto);
        return attribute.save();
    }
    async addPossibleValue(id, value) {
        const attribute = await this.findById(id);
        const cleanVal = value.trim();
        if (cleanVal && !attribute.possibleValues.includes(cleanVal)) {
            attribute.possibleValues.push(cleanVal);
            await attribute.save();
        }
        return attribute;
    }
    async softDelete(id) {
        const attribute = await this.findById(id);
        attribute.deleted = true;
        await attribute.save();
        return { success: true, message: 'ویژگی با موفقیت حذف شد.' };
    }
};
exports.AttributesService = AttributesService;
exports.AttributesService = AttributesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(attribute_schema_1.Attribute.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], AttributesService);
//# sourceMappingURL=attributes.service.js.map