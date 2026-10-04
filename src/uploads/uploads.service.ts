import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class UploadsService {
  private readonly uploadDir = path.resolve(process.cwd(), 'public/uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async processAndSaveImage(file: Express.Multer.File): Promise<{ path: string; url: string; filename: string }> {
    if (!file?.buffer || file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('حجم تصویر باید کمتر از ۱۰ مگابایت باشد.');
    }

    const filename = `aroma_${randomUUID()}.webp`;
    const targetPath = path.join(this.uploadDir, filename);

    try {
      const image = sharp(file.buffer, { limitInputPixels: 40_000_000 });
      const metadata = await image.metadata();
      if (!metadata.format || !['jpeg', 'png', 'webp', 'avif'].includes(metadata.format)) {
        throw new BadRequestException('محتوای فایل، تصویر پشتیبانی‌شده نیست.');
      }
      await image.rotate()
        .webp({ quality: 85 })
        .toFile(targetPath);
    } catch (error) {
      await fs.promises.rm(targetPath, { force: true });
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('خواندن تصویر ناموفق بود. فایل معتبر تصویر ارسال کنید.');
    }

    const relativePath = `/uploads/${filename}`;
    return {
      path: relativePath,
      url: relativePath,
      filename,
    };
  }
}
