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
exports.UpdateVariantTemplateDto = exports.CreateVariantTemplateDto = void 0;
const class_validator_1 = require("class-validator");
class CreateVariantTemplateDto {
    title;
    titleEn;
    defaultPrice;
    defaultDiscountPrice;
    defaultStock;
    unit;
    isPopular;
    order;
}
exports.CreateVariantTemplateDto = CreateVariantTemplateDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'عنوان تنوع الزامی است.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVariantTemplateDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVariantTemplateDto.prototype, "titleEn", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'قیمت پیش‌فرض الزامی است.' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0, { message: 'قیمت باید بزرگتر یا مساوی صفر باشد.' }),
    __metadata("design:type", Number)
], CreateVariantTemplateDto.prototype, "defaultPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateVariantTemplateDto.prototype, "defaultDiscountPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0, { message: 'موجودی پیش‌فرض باید بزرگتر یا مساوی صفر باشد.' }),
    __metadata("design:type", Number)
], CreateVariantTemplateDto.prototype, "defaultStock", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVariantTemplateDto.prototype, "unit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateVariantTemplateDto.prototype, "isPopular", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateVariantTemplateDto.prototype, "order", void 0);
class UpdateVariantTemplateDto {
    title;
    titleEn;
    defaultPrice;
    defaultDiscountPrice;
    defaultStock;
    unit;
    isPopular;
    order;
}
exports.UpdateVariantTemplateDto = UpdateVariantTemplateDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVariantTemplateDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVariantTemplateDto.prototype, "titleEn", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateVariantTemplateDto.prototype, "defaultPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateVariantTemplateDto.prototype, "defaultDiscountPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateVariantTemplateDto.prototype, "defaultStock", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateVariantTemplateDto.prototype, "unit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateVariantTemplateDto.prototype, "isPopular", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateVariantTemplateDto.prototype, "order", void 0);
//# sourceMappingURL=index.js.map