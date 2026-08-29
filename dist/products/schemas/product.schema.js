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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductSchema = exports.Product = exports.ProductVariantSchema = exports.ProductVariant = exports.ProductAttributeValueSchema = exports.ProductAttributeValue = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const category_schema_1 = require("../../categories/schemas/category.schema");
const attribute_schema_1 = require("../../attributes/schemas/attribute.schema");
let ProductAttributeValue = class ProductAttributeValue {
    attributeId;
    key;
    name;
    value;
    unit;
};
exports.ProductAttributeValue = ProductAttributeValue;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: attribute_schema_1.Attribute.name, required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ProductAttributeValue.prototype, "attributeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], ProductAttributeValue.prototype, "key", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], ProductAttributeValue.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], ProductAttributeValue.prototype, "value", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], ProductAttributeValue.prototype, "unit", void 0);
exports.ProductAttributeValue = ProductAttributeValue = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], ProductAttributeValue);
exports.ProductAttributeValueSchema = mongoose_1.SchemaFactory.createForClass(ProductAttributeValue);
let ProductVariant = class ProductVariant {
    id;
    title;
    titleEn;
    price;
    discountPrice;
    stockCount;
    inStock;
    isDefault;
};
exports.ProductVariant = ProductVariant;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], ProductVariant.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], ProductVariant.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], ProductVariant.prototype, "titleEn", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], ProductVariant.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 0, default: null }),
    __metadata("design:type", Number)
], ProductVariant.prototype, "discountPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 10, min: 0 }),
    __metadata("design:type", Number)
], ProductVariant.prototype, "stockCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], ProductVariant.prototype, "inStock", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], ProductVariant.prototype, "isDefault", void 0);
exports.ProductVariant = ProductVariant = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], ProductVariant);
exports.ProductVariantSchema = mongoose_1.SchemaFactory.createForClass(ProductVariant);
let Product = class Product {
    title;
    titleEn;
    slug;
    description;
    descriptionEn;
    shortDescription;
    shortDescriptionEn;
    price;
    discountPrice;
    images;
    categories;
    attributes;
    variants;
    stockCount;
    inStock;
    isVipOnly;
    rating;
    reviewCount;
    salesCount;
    isFeatured;
    deleted;
};
exports.Product = Product;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Product.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], Product.prototype, "titleEn", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, lowercase: true, trim: true }),
    __metadata("design:type", String)
], Product.prototype, "slug", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Product.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Product.prototype, "descriptionEn", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Product.prototype, "shortDescription", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Product.prototype, "shortDescriptionEn", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 0, default: null }),
    __metadata("design:type", Number)
], Product.prototype, "discountPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Product.prototype, "images", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [{ type: mongoose_2.Types.ObjectId, ref: category_schema_1.Category.name }],
        default: [],
    }),
    __metadata("design:type", Array)
], Product.prototype, "categories", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [exports.ProductAttributeValueSchema],
        default: [],
    }),
    __metadata("design:type", Array)
], Product.prototype, "attributes", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [exports.ProductVariantSchema],
        default: [],
    }),
    __metadata("design:type", Array)
], Product.prototype, "variants", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 10 }),
    __metadata("design:type", Number)
], Product.prototype, "stockCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Product.prototype, "inStock", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Product.prototype, "isVipOnly", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 4.8 }),
    __metadata("design:type", Number)
], Product.prototype, "rating", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 15 }),
    __metadata("design:type", Number)
], Product.prototype, "reviewCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "salesCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Product.prototype, "isFeatured", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Product.prototype, "deleted", void 0);
exports.Product = Product = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Product);
exports.ProductSchema = mongoose_1.SchemaFactory.createForClass(Product);
exports.ProductSchema.index({ slug: 1 });
exports.ProductSchema.index({ categories: 1 });
exports.ProductSchema.index({ isVipOnly: 1 });
exports.ProductSchema.index({ isFeatured: 1 });
exports.ProductSchema.index({ price: 1 });
exports.ProductSchema.index({ deleted: 1 });
exports.ProductSchema.index({ createdAt: -1 });
//# sourceMappingURL=product.schema.js.map