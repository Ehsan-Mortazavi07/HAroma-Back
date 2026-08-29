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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const product_schema_1 = require("./schemas/product.schema");
const category_schema_1 = require("../categories/schemas/category.schema");
const attributes_service_1 = require("../attributes/attributes.service");
let ProductsService = class ProductsService {
    productModel;
    categoryModel;
    attributesService;
    constructor(productModel, categoryModel, attributesService) {
        this.productModel = productModel;
        this.categoryModel = categoryModel;
        this.attributesService = attributesService;
    }
    async create(createProductDto) {
        const slug = createProductDto.slug.toLowerCase().trim();
        const existing = await this.productModel.findOne({ slug, deleted: false });
        if (existing) {
            throw new common_1.ConflictException('محصولی با این اسلاگ از قبل وجود دارد.');
        }
        let categoryIds = [];
        if (createProductDto.categories && createProductDto.categories.length > 0) {
            categoryIds = createProductDto.categories
                .filter((c) => mongoose_2.Types.ObjectId.isValid(c))
                .map((c) => new mongoose_2.Types.ObjectId(c));
        }
        const attributes = [];
        if (createProductDto.attributes && createProductDto.attributes.length > 0) {
            for (const attr of createProductDto.attributes) {
                let attributeId = undefined;
                if (attr.attributeId && mongoose_2.Types.ObjectId.isValid(attr.attributeId)) {
                    attributeId = new mongoose_2.Types.ObjectId(attr.attributeId);
                    try {
                        await this.attributesService.addPossibleValue(attr.attributeId, attr.value);
                    }
                    catch (e) {
                    }
                }
                attributes.push({
                    attributeId,
                    key: attr.key,
                    name: attr.name,
                    value: attr.value,
                    unit: attr.unit || '',
                });
            }
        }
        const variants = [];
        if (createProductDto.variants && createProductDto.variants.length > 0) {
            for (let i = 0; i < createProductDto.variants.length; i++) {
                const v = createProductDto.variants[i];
                const stockCount = v.stockCount !== undefined ? Number(v.stockCount) : 10;
                variants.push({
                    id: v.id || `var-${i + 1}`,
                    title: v.title.trim(),
                    price: Number(v.price),
                    discountPrice: v.discountPrice ? Number(v.discountPrice) : null,
                    stockCount,
                    inStock: v.inStock !== undefined ? v.inStock : stockCount > 0,
                    isDefault: v.isDefault || i === 0,
                });
            }
        }
        const inStock = createProductDto.inStock !== undefined
            ? createProductDto.inStock
            : (createProductDto.stockCount ?? 10) > 0;
        const product = new this.productModel({
            ...createProductDto,
            slug,
            categories: categoryIds,
            attributes,
            variants,
            inStock,
        });
        return product.save();
    }
    async findAll(query) {
        const page = Math.max(1, Number(query.page) || 1);
        const pageSize = Math.max(1, Number(query.pageSize) || 12);
        const skip = (page - 1) * pageSize;
        const filter = { deleted: false };
        if (query.q) {
            filter.$or = [
                { title: { $regex: query.q, $options: 'i' } },
                { titleEn: { $regex: query.q, $options: 'i' } },
                { shortDescription: { $regex: query.q, $options: 'i' } },
                { description: { $regex: query.q, $options: 'i' } },
                { 'attributes.value': { $regex: query.q, $options: 'i' } },
                { 'variants.title': { $regex: query.q, $options: 'i' } },
            ];
        }
        if (query.category) {
            if (mongoose_2.Types.ObjectId.isValid(query.category)) {
                filter.categories = new mongoose_2.Types.ObjectId(query.category);
            }
            else {
                const cat = await this.categoryModel.findOne({
                    slug: query.category.toLowerCase(),
                    deleted: false,
                });
                if (cat) {
                    filter.categories = cat._id;
                }
            }
        }
        if (query.isVipOnly !== undefined) {
            filter.isVipOnly = query.isVipOnly === 'true';
        }
        if (query.isFeatured !== undefined) {
            filter.isFeatured = query.isFeatured === 'true';
        }
        if (query.inStockOnly === 'true') {
            filter.inStock = true;
        }
        if (query.minPrice || query.maxPrice) {
            filter.price = {};
            if (query.minPrice)
                filter.price.$gte = Number(query.minPrice);
            if (query.maxPrice)
                filter.price.$lte = Number(query.maxPrice);
        }
        let sortOption = { createdAt: -1 };
        switch (query.sort) {
            case 'cheapest':
                sortOption = { price: 1 };
                break;
            case 'expensive':
                sortOption = { price: -1 };
                break;
            case 'popular':
                sortOption = { rating: -1, reviewCount: -1 };
                break;
            case 'bestseller':
                sortOption = { salesCount: -1 };
                break;
            case 'newest':
            default:
                sortOption = { createdAt: -1 };
                break;
        }
        const [items, total] = await Promise.all([
            this.productModel
                .find(filter)
                .populate('categories', 'name nameEn slug')
                .sort(sortOption)
                .skip(skip)
                .limit(pageSize)
                .exec(),
            this.productModel.countDocuments(filter),
        ]);
        return {
            items,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }
    async findById(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('محصول یافت نشد.');
        }
        const product = await this.productModel
            .findOne({ _id: id, deleted: false })
            .populate('categories', 'name nameEn slug')
            .exec();
        if (!product) {
            throw new common_1.NotFoundException('محصول یافت نشد.');
        }
        return product;
    }
    async findBySlug(slug) {
        const product = await this.productModel
            .findOne({ slug: slug.toLowerCase(), deleted: false })
            .populate('categories', 'name nameEn slug')
            .exec();
        if (!product) {
            throw new common_1.NotFoundException('محصول یافت نشد.');
        }
        return product;
    }
    async getFeaturedProducts(limit = 8) {
        return this.productModel
            .find({ deleted: false, isFeatured: true, inStock: true })
            .populate('categories', 'name nameEn slug')
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }
    async getBestSellers(limit = 8) {
        return this.productModel
            .find({ deleted: false, inStock: true })
            .populate('categories', 'name nameEn slug')
            .sort({ salesCount: -1, rating: -1 })
            .limit(limit)
            .exec();
    }
    async getVipExclusiveProducts(limit = 8) {
        return this.productModel
            .find({ deleted: false, isVipOnly: true })
            .populate('categories', 'name nameEn slug')
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }
    async getRelatedProducts(productId, limit = 4) {
        const product = await this.findById(productId);
        return this.productModel
            .find({
            _id: { $ne: product._id },
            categories: { $in: product.categories },
            deleted: false,
        })
            .populate('categories', 'name nameEn slug')
            .limit(limit)
            .exec();
    }
    async update(id, updateProductDto) {
        const product = await this.findById(id);
        if (updateProductDto.slug && updateProductDto.slug !== product.slug) {
            const slug = updateProductDto.slug.toLowerCase().trim();
            const existing = await this.productModel.findOne({
                slug,
                _id: { $ne: id },
                deleted: false,
            });
            if (existing) {
                throw new common_1.ConflictException('محصول دیگری با این اسلاگ وجود دارد.');
            }
            updateProductDto.slug = slug;
        }
        if (updateProductDto.categories) {
            product.categories = updateProductDto.categories
                .filter((c) => mongoose_2.Types.ObjectId.isValid(c))
                .map((c) => new mongoose_2.Types.ObjectId(c));
            delete updateProductDto.categories;
        }
        if (updateProductDto.attributes) {
            const attributes = [];
            for (const attr of updateProductDto.attributes) {
                let attributeId = undefined;
                if (attr.attributeId && mongoose_2.Types.ObjectId.isValid(attr.attributeId)) {
                    attributeId = new mongoose_2.Types.ObjectId(attr.attributeId);
                    try {
                        await this.attributesService.addPossibleValue(attr.attributeId, attr.value);
                    }
                    catch (e) {
                    }
                }
                attributes.push({
                    attributeId,
                    key: attr.key,
                    name: attr.name,
                    value: attr.value,
                    unit: attr.unit || '',
                });
            }
            product.attributes = attributes;
            delete updateProductDto.attributes;
        }
        if (updateProductDto.variants !== undefined) {
            const variants = [];
            for (let i = 0; i < updateProductDto.variants.length; i++) {
                const v = updateProductDto.variants[i];
                const stockCount = v.stockCount !== undefined ? Number(v.stockCount) : 10;
                variants.push({
                    id: v.id || `var-${i + 1}`,
                    title: v.title.trim(),
                    price: Number(v.price),
                    discountPrice: v.discountPrice ? Number(v.discountPrice) : null,
                    stockCount,
                    inStock: v.inStock !== undefined ? v.inStock : stockCount > 0,
                    isDefault: v.isDefault || false,
                });
            }
            product.variants = variants;
            delete updateProductDto.variants;
        }
        if (updateProductDto.stockCount !== undefined) {
            product.stockCount = updateProductDto.stockCount;
            product.inStock = updateProductDto.stockCount > 0;
        }
        Object.assign(product, updateProductDto);
        return product.save();
    }
    async softDelete(id) {
        const product = await this.findById(id);
        product.deleted = true;
        await product.save();
        return { success: true, message: 'محصول با موفقیت حذف شد.' };
    }
    async countTotal() {
        return this.productModel.countDocuments({ deleted: false });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(product_schema_1.Product.name)),
    __param(1, (0, mongoose_1.InjectModel)(category_schema_1.Category.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        attributes_service_1.AttributesService])
], ProductsService);
//# sourceMappingURL=products.service.js.map