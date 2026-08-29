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
exports.AttributeSchema = exports.Attribute = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let Attribute = class Attribute {
    name;
    nameEn;
    key;
    possibleValues;
    unit;
    deleted;
};
exports.Attribute = Attribute;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Attribute.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], Attribute.prototype, "nameEn", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, lowercase: true, trim: true }),
    __metadata("design:type", String)
], Attribute.prototype, "key", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Attribute.prototype, "possibleValues", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '' }),
    __metadata("design:type", String)
], Attribute.prototype, "unit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Attribute.prototype, "deleted", void 0);
exports.Attribute = Attribute = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Attribute);
exports.AttributeSchema = mongoose_1.SchemaFactory.createForClass(Attribute);
exports.AttributeSchema.index({ key: 1 });
exports.AttributeSchema.index({ deleted: 1 });
//# sourceMappingURL=attribute.schema.js.map