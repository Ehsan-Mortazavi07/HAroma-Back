import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PageSection,
  PageSectionSchema,
} from './schemas/page-section.schema';
import { PageSectionsService } from './page-sections.service';
import { PageSectionsController } from './page-sections.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PageSection.name, schema: PageSectionSchema },
    ]),
  ],
  controllers: [PageSectionsController],
  providers: [PageSectionsService],
  exports: [PageSectionsService, MongooseModule],
})
export class PageSectionsModule {}
