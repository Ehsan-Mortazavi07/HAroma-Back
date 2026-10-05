import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRole } from '../common/enums';
import {
  ConsultationConversation,
  ConsultationConversationDocument,
  ConsultationConversationStatus,
  ConsultationMessage,
  ConsultationMessageDocument,
  ConsultationMessageSender,
} from './schemas/consultation-chat.schema';
import { SendConsultationMessageDto } from './dtos/consultation-chat.dto';

type ConversationSummary = {
  id: string;
  guestName: string;
  status: ConsultationConversationStatus;
  lastMessageText: string;
  lastMessageAt: Date;
  unreadForAdmin: number;
  unreadForGuest: number;
  closedAt: Date | null;
  closedByAdminId: string | null;
  closedByAdminName: string;
  createdAt: Date;
  updatedAt: Date;
};

type MessageView = {
  id: string;
  conversationId: string;
  senderRole: ConsultationMessageSender;
  senderId: string | null;
  senderName: string;
  body: string;
  createdAt: Date;
};

@Injectable()
export class ConsultationChatService {
  constructor(
    @InjectModel(ConsultationConversation.name)
    private readonly conversationModel: Model<ConsultationConversationDocument>,
    @InjectModel(ConsultationMessage.name)
    private readonly messageModel: Model<ConsultationMessageDocument>,
  ) {}

  private getSessionHash(sessionToken: string | undefined): string {
    if (!sessionToken || !/^[A-Za-z0-9_-]{40,100}$/.test(sessionToken)) {
      throw new UnauthorizedException('نشست گفت‌وگو معتبر نیست. صفحه را تازه‌سازی کن.');
    }
    return createHash('sha256').update(sessionToken).digest('hex');
  }

  private toConversationSummary(
    conversation: ConsultationConversationDocument | Record<string, any>,
  ): ConversationSummary {
    return {
      id: String(conversation._id),
      guestName: conversation.guestName,
      status: conversation.status,
      lastMessageText: conversation.lastMessageText || '',
      lastMessageAt: conversation.lastMessageAt,
      unreadForAdmin: conversation.unreadForAdmin || 0,
      unreadForGuest: conversation.unreadForGuest || 0,
      closedAt: conversation.closedAt || null,
      closedByAdminId: conversation.closedByAdminId ? String(conversation.closedByAdminId) : null,
      closedByAdminName: conversation.closedByAdminName || '',
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  private toMessageView(message: ConsultationMessageDocument | Record<string, any>): MessageView {
    return {
      id: String(message._id),
      conversationId: String(message.conversationId),
      senderRole: message.senderRole,
      senderId: message.senderId ? String(message.senderId) : null,
      senderName: message.senderName,
      body: message.body,
      createdAt: message.createdAt,
    };
  }

  async getCurrentConversation(sessionToken: string | undefined) {
    const sessionTokenHash = this.getSessionHash(sessionToken);
    const conversation = await this.conversationModel
      .findOne({ sessionTokenHash })
      .sort({ createdAt: -1 })
      .exec();
    return conversation ? this.toConversationSummary(conversation) : null;
  }

  async listCustomerConversations(sessionToken: string | undefined) {
    const sessionTokenHash = this.getSessionHash(sessionToken);
    const conversations = await this.conversationModel
      .find({ sessionTokenHash })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .limit(100)
      .exec();
    return conversations.map((conversation) => this.toConversationSummary(conversation));
  }

  async startConversation(sessionToken: string | undefined, guestName?: string) {
    const sessionTokenHash = this.getSessionHash(sessionToken);
    const normalizedName = guestName?.trim().slice(0, 80) || 'مشتری مهمان';
    let conversation = await this.conversationModel
      .findOne({ sessionTokenHash, status: ConsultationConversationStatus.OPEN })
      .sort({ createdAt: -1 })
      .exec();

    if (conversation) {
      if (normalizedName !== 'مشتری مهمان' && conversation.guestName === 'مشتری مهمان') {
        conversation.guestName = normalizedName;
        await conversation.save();
      }
      return this.toConversationSummary(conversation);
    }

    try {
      conversation = await this.conversationModel.create({
        sessionTokenHash,
        guestName: normalizedName,
        status: ConsultationConversationStatus.OPEN,
        lastMessageAt: new Date(),
      });
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      conversation = await this.conversationModel
        .findOne({ sessionTokenHash, status: ConsultationConversationStatus.OPEN })
        .sort({ createdAt: -1 })
        .exec();
      if (!conversation) throw error;
    }
    return this.toConversationSummary(conversation);
  }

  private async findCustomerConversation(conversationId: string, sessionToken: string | undefined) {
    if (!Types.ObjectId.isValid(conversationId)) throw new NotFoundException('گفت‌وگو پیدا نشد.');
    const conversation = await this.conversationModel.findById(conversationId).exec();
    if (!conversation) throw new NotFoundException('گفت‌وگو پیدا نشد.');
    if (conversation.sessionTokenHash !== this.getSessionHash(sessionToken)) {
      throw new ForbiddenException('به این گفت‌وگو دسترسی نداری.');
    }
    return conversation;
  }

  async getCustomerMessages(
    conversationId: string,
    sessionToken: string | undefined,
    afterId?: string,
  ) {
    const conversation = await this.findCustomerConversation(conversationId, sessionToken);
    const query: Record<string, any> = { conversationId: conversation._id };
    if (afterId) {
      if (!Types.ObjectId.isValid(afterId)) throw new BadRequestException('شناسهٔ پیام معتبر نیست.');
      query._id = { $gt: new Types.ObjectId(afterId) };
    }
    const messages = await this.messageModel
      .find(query)
      .sort({ _id: afterId ? 1 : -1 })
      .limit(100)
      .exec();
    if (!afterId) messages.reverse();

    if (conversation.unreadForGuest > 0) {
      await this.conversationModel.updateOne(
        { _id: conversation._id, sessionTokenHash: conversation.sessionTokenHash },
        { $set: { unreadForGuest: 0 } },
      );
    }

    return messages.map((message) => this.toMessageView(message));
  }

  async sendCustomerMessage(
    conversationId: string,
    sessionToken: string | undefined,
    dto: SendConsultationMessageDto,
  ) {
    const conversation = await this.findCustomerConversation(conversationId, sessionToken);
    if (conversation.status !== ConsultationConversationStatus.OPEN) {
      throw new BadRequestException('این گفت‌وگو بسته شده است. یک گفت‌وگوی جدید شروع کن.');
    }
    const body = dto.body.trim();
    if (!body) throw new BadRequestException('متن پیام نمی‌تواند خالی باشد.');

    const message = await this.messageModel.create({
      conversationId: conversation._id,
      senderRole: ConsultationMessageSender.CUSTOMER,
      senderName: conversation.guestName,
      body,
    });
    await this.conversationModel.updateOne(
      { _id: conversation._id, status: ConsultationConversationStatus.OPEN },
      {
        $set: { lastMessageText: body, lastMessageAt: message.createdAt },
        $inc: { unreadForAdmin: 1 },
      },
    );
    return this.toMessageView(message);
  }

  async listAdminConversations(status: string) {
    const filter: Record<string, unknown> = {};
    if (status === ConsultationConversationStatus.OPEN || status === ConsultationConversationStatus.CLOSED) {
      filter.status = status;
    } else if (status !== 'all') {
      throw new BadRequestException('وضعیت گفت‌وگو معتبر نیست.');
    }

    const conversations = await this.conversationModel
      .find(filter)
      .sort({ lastMessageAt: -1 })
      .limit(100)
      .exec();
    return conversations.map((conversation) => this.toConversationSummary(conversation));
  }

  private async findAdminConversation(conversationId: string) {
    if (!Types.ObjectId.isValid(conversationId)) throw new NotFoundException('گفت‌وگو پیدا نشد.');
    const conversation = await this.conversationModel.findById(conversationId).exec();
    if (!conversation) throw new NotFoundException('گفت‌وگو پیدا نشد.');
    return conversation;
  }

  async getAdminMessages(conversationId: string, afterId?: string) {
    const conversation = await this.findAdminConversation(conversationId);
    const query: Record<string, any> = { conversationId: conversation._id };
    if (afterId) {
      if (!Types.ObjectId.isValid(afterId)) throw new BadRequestException('شناسهٔ پیام معتبر نیست.');
      query._id = { $gt: new Types.ObjectId(afterId) };
    }
    const messages = await this.messageModel
      .find(query)
      .sort({ _id: afterId ? 1 : -1 })
      .limit(100)
      .exec();
    if (!afterId) messages.reverse();

    await this.conversationModel.updateOne(
      { _id: conversation._id },
      { $set: { unreadForAdmin: 0 } },
    );
    return messages.map((message) => this.toMessageView(message));
  }

  async sendAdminMessage(conversationId: string, admin: any, dto: SendConsultationMessageDto) {
    if (admin?.role !== UserRole.ADMIN) throw new ForbiddenException('فقط ادمین می‌تواند به گفت‌وگوها پاسخ دهد.');
    const conversation = await this.findAdminConversation(conversationId);
    if (conversation.status !== ConsultationConversationStatus.OPEN) {
      throw new BadRequestException('گفت‌وگو بسته شده است. ابتدا آن را دوباره باز کن.');
    }
    const body = dto.body.trim();
    if (!body) throw new BadRequestException('متن پیام نمی‌تواند خالی باشد.');

    const message = await this.messageModel.create({
      conversationId: conversation._id,
      senderRole: ConsultationMessageSender.ADMIN,
      senderId: Types.ObjectId.isValid(admin._id || admin.id)
        ? new Types.ObjectId(admin._id || admin.id)
        : null,
      senderName: admin.fullName || 'پشتیبانی هاتف آروما',
      body,
    });
    await this.conversationModel.updateOne(
      { _id: conversation._id, status: ConsultationConversationStatus.OPEN },
      {
        $set: { lastMessageText: body, lastMessageAt: message.createdAt },
        $inc: { unreadForGuest: 1 },
      },
    );
    return this.toMessageView(message);
  }

  async updateAdminConversationStatus(
    conversationId: string,
    status: ConsultationConversationStatus,
    admin: any,
  ) {
    if (admin?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('فقط ادمین می‌تواند وضعیت گفت‌وگوها را تغییر دهد.');
    }
    const conversation = await this.findAdminConversation(conversationId);
    conversation.status = status;
    conversation.unreadForAdmin = 0;
    if (status === ConsultationConversationStatus.CLOSED) {
      conversation.closedAt = new Date();
      const adminId = admin._id || admin.id;
      conversation.closedByAdminId = Types.ObjectId.isValid(adminId)
        ? new Types.ObjectId(adminId)
        : null;
      conversation.closedByAdminName = String(admin.fullName || 'ادمین هاتف آروما').slice(0, 80);
    } else {
      conversation.closedAt = null;
      conversation.closedByAdminId = null;
      conversation.closedByAdminName = '';
    }
    await conversation.save();
    return this.toConversationSummary(conversation);
  }
}
