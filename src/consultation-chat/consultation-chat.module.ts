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

@Module({
  imports: [
    AuthModule,
    ThrottlerModule.forRoot([{ name: 'default', limit: 300, ttl: 60_000 }]),
    MongooseModule.forFeature([
      { name: ConsultationConversation.name, schema: ConsultationConversationSchema },
      { name: ConsultationMessage.name, schema: ConsultationMessageSchema },
    ]),
  ],
  controllers: [PublicConsultationChatController, AdminConsultationChatController],
  providers: [ConsultationChatService, ThrottlerGuard],
})
export class ConsultationChatModule {}
