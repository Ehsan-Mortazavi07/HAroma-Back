import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { put } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadsService {
  private readonly uploadDir = path.resolve(process.cwd(), 'public/uploads');

  constructor() {
    // Vercel's function filesystem is ephemeral and should not be used for
    // uploads. Production images are written to Blob instead.
    if (!process.env.VERCEL && !fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async processAndSaveImage(file: Express.Multer.File): Promise<{ path: string; url: string; filename: string }> {
    if (!file?.buffer || file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('حجم تصویر باید کمتر از ۱۰ مگابایت باشد.');
    }

    const filename = `aroma_${randomUUID()}.webp`;
    const targetPath = path.join(this.uploadDir, filename);
    let optimizedImage: Buffer;

    try {
      const image = sharp(file.buffer, { limitInputPixels: 40_000_000 });
      const metadata = await image.metadata();
      if (!metadata.format || !['jpeg', 'png', 'webp', 'avif'].includes(metadata.format)) {
        throw new BadRequestException('محتوای فایل، تصویر پشتیبانی‌شده نیست.');
      }
      optimizedImage = await image.rotate()
        .webp({ quality: 85 })
        .toBuffer();
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('خواندن تصویر ناموفق بود. فایل معتبر تصویر ارسال کنید.');
    }

    if (process.env.VERCEL) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new InternalServerErrorException('ذخیره‌سازی تصویر تنظیم نشده است.');
      }

      try {
        const blob = await put(filename, optimizedImage, {
          access: 'public',
          contentType: 'image/webp',
          addRandomSuffix: false,
        });

        return {
          path: blob.url,
          url: blob.url,
          filename,
        };
      } catch {
        throw new ServiceUnavailableException('ذخیره تصویر ناموفق بود. دوباره تلاش کنید.');
      }
    }

    await fs.promises.writeFile(targetPath, optimizedImage);

    const relativePath = `/uploads/${filename}`;
    return {
      path: relativePath,
      url: relativePath,
      filename,
    };
  }
}
