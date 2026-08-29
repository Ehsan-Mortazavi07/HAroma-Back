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
exports.PageSectionSchema = exports.PageSection = exports.SectionBannerSchema = exports.SectionBanner = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let SectionBanner = class SectionBanner {
    imageUrl;
    link;
    title;
    subtitle;
    badge;
    bgGradient;
};
exports.SectionBanner = SectionBanner;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SectionBanner.prototype, "imageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '/' }),
    __metadata("design:type", String)
], SectionBanner.prototype, "link", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], SectionBanner.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], SectionBanner.prototype, "subtitle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], SectionBanner.prototype, "badge", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], SectionBanner.prototype, "bgGradient", void 0);
exports.SectionBanner = SectionBanner = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], SectionBanner);
exports.SectionBannerSchema = mongoose_1.SchemaFactory.createForClass(SectionBanner);
let PageSection = class PageSection {
    sectionKey;
    title;
    titleEn;
    subtitle;
    isVisible;
    isVipOnly;
    order;
    banners;
    config;
    deleted;
};
exports.PageSection = PageSection;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, trim: true }),
    __metadata("design:type", String)
], PageSection.prototype, "sectionKey", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], PageSection.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], PageSection.prototype, "titleEn", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], PageSection.prototype, "subtitle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], PageSection.prototype, "isVisible", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], PageSection.prototype, "isVipOnly", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PageSection.prototype, "order", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.SectionBannerSchema], default: [] }),
    __metadata("design:type", Array)
], PageSection.prototype, "banners", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], PageSection.prototype, "config", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], PageSection.prototype, "deleted", void 0);
exports.PageSection = PageSection = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], PageSection);
exports.PageSectionSchema = mongoose_1.SchemaFactory.createForClass(PageSection);
exports.PageSectionSchema.index({ sectionKey: 1 });
exports.PageSectionSchema.index({ order: 1 });
exports.PageSectionSchema.index({ isVisible: 1 });
//# sourceMappingURL=page-section.schema.js.map