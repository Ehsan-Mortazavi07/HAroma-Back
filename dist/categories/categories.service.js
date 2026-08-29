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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const category_schema_1 = require("./schemas/category.schema");
let CategoriesService = class CategoriesService {
    categoryModel;
    constructor(categoryModel) {
        this.categoryModel = categoryModel;
    }
    async create(createCategoryDto) {
        const existing = await this.categoryModel.findOne({
            slug: createCategoryDto.slug.toLowerCase(),
            deleted: false,
        });
        if (existing) {
            throw new common_1.ConflictException('دسته‌بندی با این اسلاگ از قبل وجود دارد.');
        }
        const category = new this.categoryModel({
            ...createCategoryDto,
            slug: createCategoryDto.slug.toLowerCase(),
        });
        return category.save();
    }
    async findAll(query) {
        const filter = { deleted: false };
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
        return this.categoryModel.find(filter).sort({ order: 1, createdAt: -1 }).exec();
    }
    async findById(id) {
        const category = await this.categoryModel.findOne({ _id: id, deleted: false }).exec();
        if (!category) {
            throw new common_1.NotFoundException('دسته‌بندی مورد نظر یافت نشد.');
        }
        return category;
    }
    async findBySlug(slug) {
        const category = await this.categoryModel.findOne({
            slug: slug.toLowerCase(),
            deleted: false,
        }).exec();
        if (!category) {
            throw new common_1.NotFoundException('دسته‌بندی مورد نظر یافت نشد.');
        }
        return category;
    }
    async update(id, updateCategoryDto) {
        const category = await this.findById(id);
        if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
            const existing = await this.categoryModel.findOne({
                slug: updateCategoryDto.slug.toLowerCase(),
                _id: { $ne: id },
                deleted: false,
            });
            if (existing) {
                throw new common_1.ConflictException('دسته‌بندی دیگری با این اسلاگ وجود دارد.');
            }
            updateCategoryDto.slug = updateCategoryDto.slug.toLowerCase();
        }
        Object.assign(category, updateCategoryDto);
        return category.save();
    }
    async softDelete(id) {
        const category = await this.findById(id);
        category.deleted = true;
        await category.save();
        return { success: true, message: 'دسته‌بندی با موفقیت حذف شد.' };
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(category_schema_1.Category.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map