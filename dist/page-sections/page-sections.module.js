"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageSectionsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const page_section_schema_1 = require("./schemas/page-section.schema");
const page_sections_service_1 = require("./page-sections.service");
const page_sections_controller_1 = require("./page-sections.controller");
let PageSectionsModule = class PageSectionsModule {
};
exports.PageSectionsModule = PageSectionsModule;
exports.PageSectionsModule = PageSectionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: page_section_schema_1.PageSection.name, schema: page_section_schema_1.PageSectionSchema },
            ]),
        ],
        controllers: [page_sections_controller_1.PageSectionsController],
        providers: [page_sections_service_1.PageSectionsService],
        exports: [page_sections_service_1.PageSectionsService, mongoose_1.MongooseModule],
    })
], PageSectionsModule);
//# sourceMappingURL=page-sections.module.js.map