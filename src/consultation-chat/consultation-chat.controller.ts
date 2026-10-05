import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UserRole } from '../common/enums';
import {
  SendConsultationMessageDto,
  StartConsultationConversationDto,
  UpdateConsultationConversationStatusDto,
} from './dtos/consultation-chat.dto';
import { ConsultationChatService } from './consultation-chat.service';

@Controller('consultation-chat')
@UseGuards(ThrottlerGuard)
export class PublicConsultationChatController {
  constructor(private readonly chatService: ConsultationChatService) {}

  @Get('current')
  getCurrentConversation(@Headers('x-chat-session') sessionToken?: string) {
    return this.chatService.getCurrentConversation(sessionToken);
  }

  @Post('current')
  @Throttle({ default: { limit: 8, ttl: 60_000, blockDuration: 60_000 } })
  startConversation(
    @Headers('x-chat-session') sessionToken: string | undefined,
    @Body() dto: StartConsultationConversationDto,
  ) {
    return this.chatService.startConversation(sessionToken, dto.guestName);
  }

  @Get(':conversationId/messages')
  getMessages(
    @Param('conversationId') conversationId: string,
    @Headers('x-chat-session') sessionToken: string | undefined,
    @Query('afterId') afterId?: string,
  ) {
    return this.chatService.getCustomerMessages(conversationId, sessionToken, afterId);
  }

  @Post(':conversationId/messages')
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 60_000 } })
  sendMessage(
    @Param('conversationId') conversationId: string,
    @Headers('x-chat-session') sessionToken: string | undefined,
    @Body() dto: SendConsultationMessageDto,
  ) {
    return this.chatService.sendCustomerMessage(conversationId, sessionToken, dto);
  }
}

@Controller({ version: '1', path: 'admin/consultation-chat' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminConsultationChatController {
  constructor(private readonly chatService: ConsultationChatService) {}

  @Get('conversations')
  listConversations(@Query('status') status = 'open') {
    return this.chatService.listAdminConversations(status);
  }

  @Get('conversations/:conversationId/messages')
  getMessages(
    @Param('conversationId') conversationId: string,
    @Query('afterId') afterId?: string,
  ) {
    return this.chatService.getAdminMessages(conversationId, afterId);
  }

  @Post('conversations/:conversationId/messages')
  sendMessage(
    @Param('conversationId') conversationId: string,
    @CurrentUser() admin: any,
    @Body() dto: SendConsultationMessageDto,
  ) {
    return this.chatService.sendAdminMessage(conversationId, admin, dto);
  }

  @Patch('conversations/:conversationId/status')
  updateStatus(
    @Param('conversationId') conversationId: string,
    @CurrentUser() admin: any,
    @Body() dto: UpdateConsultationConversationStatusDto,
  ) {
    return this.chatService.updateAdminConversationStatus(conversationId, dto.status, admin);
  }
}
