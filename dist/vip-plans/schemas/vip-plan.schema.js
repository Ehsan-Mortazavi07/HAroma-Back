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
exports.VipPlanSchema = exports.VipPlan = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let VipPlan = class VipPlan {
    title;
    titleEn;
    description;
    descriptionEn;
    price;
    durationDays;
    discountPercent;
    perks;
    perksEn;
    badgeColor;
    isPopular;
    isActive;
    deleted;
};
exports.VipPlan = VipPlan;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], VipPlan.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], VipPlan.prototype, "titleEn", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], VipPlan.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], VipPlan.prototype, "descriptionEn", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], VipPlan.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 1, default: 30 }),
    __metadata("design:type", Number)
], VipPlan.prototype, "durationDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 0, max: 100, default: 10 }),
    __metadata("design:type", Number)
], VipPlan.prototype, "discountPercent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], VipPlan.prototype, "perks", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], VipPlan.prototype, "perksEn", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '#d4af37' }),
    __metadata("design:type", String)
], VipPlan.prototype, "badgeColor", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], VipPlan.prototype, "isPopular", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], VipPlan.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], VipPlan.prototype, "deleted", void 0);
exports.VipPlan = VipPlan = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], VipPlan);
exports.VipPlanSchema = mongoose_1.SchemaFactory.createForClass(VipPlan);
exports.VipPlanSchema.index({ isActive: 1 });
exports.VipPlanSchema.index({ deleted: 1 });
//# sourceMappingURL=vip-plan.schema.js.map