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
import { ConsultationChatGateway } from './consultation-chat.gateway';

@Controller('consultation-chat')
@UseGuards(ThrottlerGuard, OptionalJwtAuthGuard)
export class PublicConsultationChatController {
  constructor(
    private readonly chatService: ConsultationChatService,
    private readonly chatGateway: ConsultationChatGateway,
  ) {}

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
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 60_000 } })
  async startConversation(
    @Headers('x-chat-session') sessionToken: string | undefined,
    @Body() dto: StartConsultationConversationDto,
    @CurrentUser() user?: UserDocument,
  ) {
    const result = await this.chatService.startConversationRealtime(sessionToken, dto, user);
    this.chatGateway.emitConversationUpdates([...result.closedConversations, result.conversation]);
    return result.conversation.customer;
  }

  @Get(':conversationId/messages')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Headers('x-chat-session') sessionToken: string | undefined,
    @Query('afterId') afterId?: string,
    @CurrentUser() user?: UserDocument,
  ) {
    const messages = await this.chatService.getCustomerMessages(conversationId, sessionToken, afterId, user);
    const summary = await this.chatService.getRealtimeConversationSummary(conversationId);
    if (summary) this.chatGateway.emitConversationUpdates([summary]);
    return messages;
  }

  @Post(':conversationId/messages')
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Headers('x-chat-session') sessionToken: string | undefined,
    @Body() dto: SendConsultationMessageDto,
    @CurrentUser() user?: UserDocument,
  ) {
    const result = await this.chatService.sendCustomerMessageRealtime(conversationId, sessionToken, dto, user);
    this.chatGateway.publishRealtimeMessage(result);
    return result.customer;
  }
}

@Controller({ version: '1', path: 'admin/consultation-chat' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminConsultationChatController {
  constructor(
    private readonly chatService: ConsultationChatService,
    private readonly chatGateway: ConsultationChatGateway,
  ) {}

  @Get('conversations')
  listConversations(@Query('status') status = 'open') {
    return this.chatService.listAdminConversations(status);
  }

  @Get('conversations/:conversationId/messages')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('afterId') afterId?: string,
  ) {
    const messages = await this.chatService.getAdminMessages(conversationId, afterId);
    const summary = await this.chatService.getRealtimeConversationSummary(conversationId);
    if (summary) this.chatGateway.emitConversationUpdates([summary]);
    return messages;
  }

  @Post('conversations/:conversationId/messages')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @CurrentUser() admin: UserDocument,
    @Body() dto: SendConsultationMessageDto,
  ) {
    const result = await this.chatService.sendAdminMessageRealtime(conversationId, admin, dto);
    this.chatGateway.publishRealtimeMessage(result);
    return result.admin;
  }

  @Patch('conversations/:conversationId/status')
  async updateStatus(
    @Param('conversationId') conversationId: string,
    @CurrentUser() admin: UserDocument,
    @Body() dto: UpdateConsultationConversationStatusDto,
  ) {
    const result = await this.chatService.updateAdminConversationStatusRealtime(conversationId, dto.status, admin);
    this.chatGateway.emitConversationUpdates([...result.closedConversations, result.conversation]);
    return result.conversation.admin;
  }

  @Delete('conversations/:conversationId')
  async deleteConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() admin: UserDocument,
  ) {
    const result = await this.chatService.deleteAdminConversation(conversationId, admin);
    this.chatGateway.emitConversationDeleted(result.id);
    return result;
  }
}
