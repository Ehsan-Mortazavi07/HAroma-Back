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
import type { UserDocument } from '../users/schemas/user.schema';
import {
  ConsultationConversation,
  ConsultationConversationDocument,
  ConsultationConversationStatus,
  ConsultationMessage,
  ConsultationMessageDocument,
  ConsultationMessageSender,
} from './schemas/consultation-chat.schema';
import {
  SendConsultationMessageDto,
  StartConsultationConversationDto,
} from './dtos/consultation-chat.dto';

type ConversationSummary = {
  id: string;
  guestName: string;
  subject: string;
  userId: string | null;
  guestPhone: string;
  guestEmail: string;
  guestUsername: string;
  guestProvince: string;
  guestCity: string;
  status: ConsultationConversationStatus;
  lastMessageText: string;
  lastMessageAt: Date;
  unreadForAdmin: number;
  unreadForGuest: number;
  lastCustomerMessageReadAt: Date | null;
  lastAdminMessageReadAt: Date | null;
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

  private getUserId(user?: UserDocument | null): Types.ObjectId | null {
    const id = user?._id;
    return id && Types.ObjectId.isValid(String(id)) ? new Types.ObjectId(String(id)) : null;
  }

  private customerOwnerFilter(sessionTokenHash: string, user?: UserDocument | null) {
    const userId = this.getUserId(user);
    if (!userId) return { sessionTokenHash, userId: null };
    return {
      $or: [
        { userId },
        { sessionTokenHash, userId: null },
      ],
    };
  }

  private toConversationSummary(
    conversation: ConsultationConversationDocument | Record<string, any>,
    forCustomer = false,
  ): ConversationSummary {
    return {
      id: String(conversation._id),
      guestName: conversation.guestName || 'مشتری مهمان',
      subject: conversation.subject || 'مشاوره',
      userId: forCustomer || !conversation.userId ? null : String(conversation.userId),
      guestPhone: forCustomer ? '' : conversation.guestPhone || '',
      guestEmail: forCustomer ? '' : conversation.guestEmail || '',
      guestUsername: forCustomer ? '' : conversation.guestUsername || '',
      guestProvince: forCustomer ? '' : conversation.guestProvince || '',
      guestCity: forCustomer ? '' : conversation.guestCity || '',
      status: conversation.status,
      lastMessageText: conversation.lastMessageText || '',
      lastMessageAt: conversation.lastMessageAt || conversation.createdAt,
      unreadForAdmin: conversation.unreadForAdmin || 0,
      unreadForGuest: conversation.unreadForGuest || 0,
      lastCustomerMessageReadAt: conversation.lastCustomerMessageReadAt || null,
      lastAdminMessageReadAt: conversation.lastAdminMessageReadAt || null,
      closedAt: conversation.closedAt || null,
      closedByAdminId: forCustomer || !conversation.closedByAdminId
        ? null
        : String(conversation.closedByAdminId),
      closedByAdminName: forCustomer ? '' : conversation.closedByAdminName || '',
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  private toMessageView(
    message: ConsultationMessageDocument | Record<string, any>,
    forCustomer = false,
  ): MessageView {
    const isAdmin = message.senderRole === ConsultationMessageSender.ADMIN;
    return {
      id: String(message._id),
      conversationId: String(message.conversationId),
      senderRole: message.senderRole,
      senderId: forCustomer && isAdmin ? null : message.senderId ? String(message.senderId) : null,
      senderName: forCustomer && isAdmin ? 'ادمین' : message.senderName,
      body: message.body,
      createdAt: message.createdAt,
    };
  }

  async getCurrentConversation(sessionToken: string | undefined, user?: UserDocument | null) {
    const sessionTokenHash = this.getSessionHash(sessionToken);
    const conversation = await this.conversationModel
      .findOne(this.customerOwnerFilter(sessionTokenHash, user))
      .sort({ createdAt: -1 })
      .exec();
    return conversation ? this.toConversationSummary(conversation, true) : null;
  }

  async listCustomerConversations(sessionToken: string | undefined, user?: UserDocument | null) {
    const sessionTokenHash = this.getSessionHash(sessionToken);
    const conversations = await this.conversationModel
      .find(this.customerOwnerFilter(sessionTokenHash, user))
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .limit(100)
      .exec();
    return conversations.map((conversation) => this.toConversationSummary(conversation, true));
  }

  async startConversation(
    sessionToken: string | undefined,
    dto: StartConsultationConversationDto,
    user?: UserDocument | null,
  ) {
    const sessionTokenHash = this.getSessionHash(sessionToken);
    const subject = dto.subject.trim();
    const userId = this.getUserId(user);
    const fullName = user?.fullName?.trim();
    const guestName = userId ? fullName : dto.guestName?.trim();
    if (!subject || subject.length < 3) {
      throw new BadRequestException('موضوع گفت‌وگو را بنویس.');
    }
    if (!guestName) {
      throw new BadRequestException('واردکردن نام برای شروع گفت‌وگو الزامی است.');
    }

    const ownerFilter = this.customerOwnerFilter(sessionTokenHash, user);
    const existingRequest = await this.conversationModel
      .findOne({ ...ownerFilter, status: ConsultationConversationStatus.PENDING })
      .sort({ createdAt: -1 })
      .exec();
    if (existingRequest) return this.toConversationSummary(existingRequest, true);

    const now = new Date();
    await this.conversationModel.updateMany(
      {
        $or: [
          { sessionTokenHash },
          ...(userId ? [{ userId }] : []),
        ],
        status: ConsultationConversationStatus.OPEN,
      },
      {
        $set: {
          status: ConsultationConversationStatus.CLOSED,
          closedAt: now,
          closedByAdminId: null,
          closedByAdminName: '',
        },
      },
    );

    try {
      const conversation = await this.conversationModel.create({
        sessionTokenHash,
        userId,
        guestName: guestName.slice(0, 80),
        subject: subject.slice(0, 120),
        guestPhone: user?.phone?.trim() || '',
        guestEmail: user?.email?.trim() || '',
        guestUsername: user?.username?.trim() || '',
        guestProvince: user?.province?.trim() || '',
        guestCity: user?.city?.trim() || '',
        status: ConsultationConversationStatus.PENDING,
        lastMessageAt: now,
      });
      return this.toConversationSummary(conversation, true);
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      const pending = await this.conversationModel
        .findOne({ ...ownerFilter, status: ConsultationConversationStatus.PENDING })
        .sort({ createdAt: -1 })
        .exec();
      if (pending) return this.toConversationSummary(pending, true);
      throw error;
    }
  }

  private async findCustomerConversation(
    conversationId: string,
    sessionToken: string | undefined,
    user?: UserDocument | null,
  ) {
    if (!Types.ObjectId.isValid(conversationId)) throw new NotFoundException('گفت‌وگو پیدا نشد.');
    const conversation = await this.conversationModel.findById(conversationId).exec();
    if (!conversation) throw new NotFoundException('گفت‌وگو پیدا نشد.');
    const sessionTokenHash = this.getSessionHash(sessionToken);
    const userId = this.getUserId(user);
    const sameUser = userId && conversation.userId?.equals(userId);
    const isLegacySession = !conversation.userId && conversation.sessionTokenHash === sessionTokenHash;
    if (!sameUser && !isLegacySession) {
      throw new ForbiddenException('به این گفت‌وگو دسترسی نداری.');
    }
    return conversation;
  }

  async getCustomerMessages(
    conversationId: string,
    sessionToken: string | undefined,
    afterId?: string,
    user?: UserDocument | null,
  ) {
    const conversation = await this.findCustomerConversation(conversationId, sessionToken, user);
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
      { $set: { unreadForGuest: 0, lastAdminMessageReadAt: new Date() } },
    );
    return messages.map((message) => this.toMessageView(message, true));
  }

  async sendCustomerMessage(
    conversationId: string,
    sessionToken: string | undefined,
    dto: SendConsultationMessageDto,
    user?: UserDocument | null,
  ) {
    const conversation = await this.findCustomerConversation(conversationId, sessionToken, user);
    if (conversation.status !== ConsultationConversationStatus.OPEN) {
      throw new BadRequestException(
        conversation.status === ConsultationConversationStatus.PENDING
          ? 'گفت‌وگو پس از تأیید ادمین باز می‌شود.'
          : 'این گفت‌وگو بسته شده است. یک گفت‌وگوی جدید شروع کن.',
      );
    }
    const body = dto.body.trim();
    if (!body) throw new BadRequestException('متن پیام نمی‌تواند خالی باشد.');

    const message = await this.messageModel.create({
      conversationId: conversation._id,
      senderRole: ConsultationMessageSender.CUSTOMER,
      senderId: this.getUserId(user),
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
    return this.toMessageView(message, true);
  }

  async listAdminConversations(status: string) {
    const filter: Record<string, unknown> = {};
    if (Object.values(ConsultationConversationStatus).includes(status as ConsultationConversationStatus)) {
      filter.status = status;
    } else if (status !== 'all') {
      throw new BadRequestException('وضعیت گفت‌وگو معتبر نیست.');
    }

    const conversations = await this.conversationModel
      .find(filter)
      .sort({ status: 1, lastMessageAt: -1 })
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
      { $set: { unreadForAdmin: 0, lastCustomerMessageReadAt: new Date() } },
    );
    return messages.map((message) => this.toMessageView(message));
  }

  async sendAdminMessage(conversationId: string, admin: UserDocument, dto: SendConsultationMessageDto) {
    if (admin?.role !== UserRole.ADMIN) throw new ForbiddenException('فقط ادمین می‌تواند به گفت‌وگوها پاسخ دهد.');
    const conversation = await this.findAdminConversation(conversationId);
    if (conversation.status !== ConsultationConversationStatus.OPEN) {
      throw new BadRequestException('گفت‌وگو باز نیست. ابتدا درخواست را تأیید یا آن را بازگشایی کن.');
    }
    const body = dto.body.trim();
    if (!body) throw new BadRequestException('متن پیام نمی‌تواند خالی باشد.');

    const message = await this.messageModel.create({
      conversationId: conversation._id,
      senderRole: ConsultationMessageSender.ADMIN,
      senderId: this.getUserId(admin),
      senderName: admin.fullName || 'ادمین',
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
    status: ConsultationConversationStatus.OPEN | ConsultationConversationStatus.CLOSED,
    admin: UserDocument,
  ) {
    if (admin?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('فقط ادمین می‌تواند وضعیت گفت‌وگوها را تغییر دهد.');
    }
    const conversation = await this.findAdminConversation(conversationId);
    const adminId = this.getUserId(admin);

    if (status === ConsultationConversationStatus.OPEN) {
      const ownerFilter = conversation.userId
        ? {
            $or: [
              { userId: conversation.userId },
              { sessionTokenHash: conversation.sessionTokenHash },
            ],
          }
        : { sessionTokenHash: conversation.sessionTokenHash, userId: null };
      await this.conversationModel.updateMany(
        {
          ...ownerFilter,
          _id: { $ne: conversation._id },
          status: ConsultationConversationStatus.OPEN,
        },
        {
          $set: {
            status: ConsultationConversationStatus.CLOSED,
            closedAt: new Date(),
            closedByAdminId: adminId,
            closedByAdminName: String(admin.fullName || 'ادمین').slice(0, 80),
          },
        },
      );
      conversation.status = ConsultationConversationStatus.OPEN;
      conversation.closedAt = null;
      conversation.closedByAdminId = null;
      conversation.closedByAdminName = '';
    } else if (status === ConsultationConversationStatus.CLOSED) {
      conversation.status = status;
      conversation.closedAt = new Date();
      conversation.closedByAdminId = adminId;
      conversation.closedByAdminName = String(admin.fullName || 'ادمین').slice(0, 80);
    } else {
      throw new BadRequestException('وضعیت درخواستی برای ادمین معتبر نیست.');
    }
    conversation.unreadForAdmin = 0;
    await conversation.save();
    return this.toConversationSummary(conversation);
  }

  async deleteAdminConversation(conversationId: string, admin: UserDocument) {
    if (admin?.role !== UserRole.ADMIN) throw new ForbiddenException('فقط ادمین می‌تواند گفت‌وگوها را حذف کند.');
    const conversation = await this.findAdminConversation(conversationId);
    await this.conversationModel.deleteOne({ _id: conversation._id }).exec();
    await this.messageModel.deleteMany({ conversationId: conversation._id }).exec();
    return { id: String(conversation._id), deleted: true };
  }
}
