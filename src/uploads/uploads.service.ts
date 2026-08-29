import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

@Injectable()
export class UploadsService {
  private readonly uploadDir = path.resolve(process.cwd(), 'public/uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async processAndSaveImage(file: Express.Multer.File): Promise<{ path: string; url: string; filename: string }> {
    const filename = `aroma_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webp`;
    const targetPath = path.join(this.uploadDir, filename);

    try {
      await sharp(file.buffer)
        .webp({ quality: 85 })
        .toFile(targetPath);
    } catch (e) {
      // Fallback if sharp fails
      fs.writeFileSync(targetPath, file.buffer);
    }

    const relativePath = `/uploads/${filename}`;
    return {
      path: relativePath,
      url: relativePath,
      filename,
    };
  }
}
