"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariantTemplatesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const variant_template_schema_1 = require("./schemas/variant-template.schema");
const variant_templates_service_1 = require("./variant-templates.service");
const variant_templates_controller_1 = require("./variant-templates.controller");
let VariantTemplatesModule = class VariantTemplatesModule {
};
exports.VariantTemplatesModule = VariantTemplatesModule;
exports.VariantTemplatesModule = VariantTemplatesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: variant_template_schema_1.VariantTemplate.name, schema: variant_template_schema_1.VariantTemplateSchema },
            ]),
        ],
        controllers: [variant_templates_controller_1.VariantTemplatesController],
        providers: [variant_templates_service_1.VariantTemplatesService],
        exports: [variant_templates_service_1.VariantTemplatesService],
    })
], VariantTemplatesModule);
//# sourceMappingURL=variant-templates.module.js.map