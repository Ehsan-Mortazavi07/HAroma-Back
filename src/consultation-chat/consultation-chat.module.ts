import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConsultationChatService } from './consultation-chat.service';
import {
  AdminConsultationChatController,
  PublicConsultationChatController,
} from './consultation-chat.controller';
import {
  ConsultationConversation,
  ConsultationConversationSchema,
  ConsultationMessage,
  ConsultationMessageSchema,
} from './schemas/consultation-chat.schema';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ConsultationChatGateway } from './consultation-chat.gateway';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ThrottlerModule.forRoot([{ name: 'default', limit: 300, ttl: 60_000 }]),
    MongooseModule.forFeature([
      { name: ConsultationConversation.name, schema: ConsultationConversationSchema },
      { name: ConsultationMessage.name, schema: ConsultationMessageSchema },
    ]),
  ],
  controllers: [PublicConsultationChatController, AdminConsultationChatController],
  providers: [ConsultationChatService, ConsultationChatGateway, ThrottlerGuard],
  exports: [ConsultationChatGateway],
})
export class ConsultationChatModule {}
