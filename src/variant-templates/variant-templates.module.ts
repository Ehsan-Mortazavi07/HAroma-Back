import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VariantTemplate, VariantTemplateSchema } from './schemas/variant-template.schema';
import { VariantTemplatesService } from './variant-templates.service';
import { VariantTemplatesController } from './variant-templates.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VariantTemplate.name, schema: VariantTemplateSchema },
    ]),
  ],
  controllers: [VariantTemplatesController],
  providers: [VariantTemplatesService],
  exports: [VariantTemplatesService],
})
export class VariantTemplatesModule {}
