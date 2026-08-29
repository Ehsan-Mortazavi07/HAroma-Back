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
exports.VariantTemplateSchema = exports.VariantTemplate = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let VariantTemplate = class VariantTemplate {
    title;
    titleEn;
    defaultPrice;
    defaultDiscountPrice;
    defaultStock;
    unit;
    isPopular;
    order;
    deleted;
};
exports.VariantTemplate = VariantTemplate;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], VariantTemplate.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], VariantTemplate.prototype, "titleEn", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], VariantTemplate.prototype, "defaultPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 0, default: null }),
    __metadata("design:type", Number)
], VariantTemplate.prototype, "defaultDiscountPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 10, min: 0 }),
    __metadata("design:type", Number)
], VariantTemplate.prototype, "defaultStock", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: 'میل' }),
    __metadata("design:type", String)
], VariantTemplate.prototype, "unit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], VariantTemplate.prototype, "isPopular", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], VariantTemplate.prototype, "order", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], VariantTemplate.prototype, "deleted", void 0);
exports.VariantTemplate = VariantTemplate = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], VariantTemplate);
exports.VariantTemplateSchema = mongoose_1.SchemaFactory.createForClass(VariantTemplate);
exports.VariantTemplateSchema.index({ order: 1 });
exports.VariantTemplateSchema.index({ deleted: 1 });
//# sourceMappingURL=variant-template.schema.js.map