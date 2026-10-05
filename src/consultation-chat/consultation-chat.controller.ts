import {
  Body,
  Controller,
  Delete,
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
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { UserRole } from '../common/enums';
import type { UserDocument } from '../users/schemas/user.schema';
import {
  SendConsultationMessageDto,
  StartConsultationConversationDto,
  UpdateConsultationConversationStatusDto,
} from './dtos/consultation-chat.dto';
import { ConsultationChatService } from './consultation-chat.service';

@Controller('consultation-chat')
@UseGuards(ThrottlerGuard, OptionalJwtAuthGuard)
export class PublicConsultationChatController {
  constructor(private readonly chatService: ConsultationChatService) {}

  @Get('current')
  getCurrentConversation(
    @Headers('x-chat-session') sessionToken: string | undefined,
    @CurrentUser() user?: UserDocument,
  ) {
    return this.chatService.getCurrentConversation(sessionToken, user);
  }

  @Get('conversations')
  listCustomerConversations(
    @Headers('x-chat-session') sessionToken: string | undefined,
    @CurrentUser() user?: UserDocument,
  ) {
    return this.chatService.listCustomerConversations(sessionToken, user);
  }

  @Post('current')
  @Throttle({ default: { limit: 8, ttl: 60_000, blockDuration: 60_000 } })
  startConversation(
    @Headers('x-chat-session') sessionToken: string | undefined,
    @Body() dto: StartConsultationConversationDto,
    @CurrentUser() user?: UserDocument,
  ) {
    return this.chatService.startConversation(sessionToken, dto, user);
  }

  @Get(':conversationId/messages')
  getMessages(
    @Param('conversationId') conversationId: string,
    @Headers('x-chat-session') sessionToken: string | undefined,
    @Query('afterId') afterId?: string,
    @CurrentUser() user?: UserDocument,
  ) {
    return this.chatService.getCustomerMessages(conversationId, sessionToken, afterId, user);
  }

  @Post(':conversationId/messages')
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 60_000 } })
  sendMessage(
    @Param('conversationId') conversationId: string,
    @Headers('x-chat-session') sessionToken: string | undefined,
    @Body() dto: SendConsultationMessageDto,
    @CurrentUser() user?: UserDocument,
  ) {
    return this.chatService.sendCustomerMessage(conversationId, sessionToken, dto, user);
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
    @CurrentUser() admin: UserDocument,
    @Body() dto: SendConsultationMessageDto,
  ) {
    return this.chatService.sendAdminMessage(conversationId, admin, dto);
  }

  @Patch('conversations/:conversationId/status')
  updateStatus(
    @Param('conversationId') conversationId: string,
    @CurrentUser() admin: UserDocument,
    @Body() dto: UpdateConsultationConversationStatusDto,
  ) {
    return this.chatService.updateAdminConversationStatus(conversationId, dto.status, admin);
  }

  @Delete('conversations/:conversationId')
  deleteConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() admin: UserDocument,
  ) {
    return this.chatService.deleteAdminConversation(conversationId, admin);
  }
}
