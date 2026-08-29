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
exports.UploadsService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const sharp_1 = require("sharp");
let UploadsService = class UploadsService {
    uploadDir = path.resolve(process.cwd(), 'public/uploads');
    constructor() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }
    async processAndSaveImage(file) {
        const filename = `aroma_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webp`;
        const targetPath = path.join(this.uploadDir, filename);
        try {
            await (0, sharp_1.default)(file.buffer)
                .webp({ quality: 85 })
                .toFile(targetPath);
        }
        catch (e) {
            fs.writeFileSync(targetPath, file.buffer);
        }
        const relativePath = `/uploads/${filename}`;
        return {
            path: relativePath,
            url: relativePath,
            filename,
        };
    }
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UploadsService);
//# sourceMappingURL=uploads.service.js.map