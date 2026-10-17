import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AnalyticsSession, AnalyticsSessionSchema } from './schemas/analytics-session.schema';
import { AnalyticsPageView, AnalyticsPageViewSchema } from './schemas/analytics-page-view.schema';
import { AnalyticsEvent, AnalyticsEventSchema } from './schemas/analytics-event.schema';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { VipPlansModule } from '../vip-plans/vip-plans.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    OrdersModule,
    ProductsModule,
    CategoriesModule,
    SubscriptionsModule,
    VipPlansModule,
    ThrottlerModule.forRoot([{ name: 'default', limit: 300, ttl: 60_000 }]),
    MongooseModule.forFeature([
      { name: AnalyticsSession.name, schema: AnalyticsSessionSchema },
      { name: AnalyticsPageView.name, schema: AnalyticsPageViewSchema },
      { name: AnalyticsEvent.name, schema: AnalyticsEventSchema },
    ]),
  ],
  controllers: [AnalyticsController, ReportsController],
  providers: [AnalyticsService, ReportsService, ThrottlerGuard],
})
export class AnalyticsModule {}
