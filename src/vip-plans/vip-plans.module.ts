import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VipPlan, VipPlanSchema } from './schemas/vip-plan.schema';
import { VipPlansService } from './vip-plans.service';
import { VipPlansController } from './vip-plans.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: VipPlan.name, schema: VipPlanSchema }]),
  ],
  controllers: [VipPlansController],
  providers: [VipPlansService],
  exports: [VipPlansService, MongooseModule],
})
export class VipPlansModule {}
