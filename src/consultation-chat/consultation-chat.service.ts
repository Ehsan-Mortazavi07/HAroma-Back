import { createHash, randomBytes } from 'node:crypto';
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
import { UsersService } from '../users/users.service';
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
  StartAdminConsultationConversationDto,
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

export type RealtimeConversation = {
  admin: ConversationSummary;
  customer: ConversationSummary;
};

export type RealtimeMessage = {
  admin: MessageView;
  customer: MessageView;
  conversation: RealtimeConversation;
};

export type RealtimeConversationStart = {
  conversation: RealtimeConversation;
  closedConversations: RealtimeConversation[];
  reused?: boolean;
};

@Injectable()
export class ConsultationChatService {
  constructor(
    @InjectModel(ConsultationConversation.name)
    private readonly conversationModel: Model<ConsultationConversationDocument>,
    @InjectModel(ConsultationMessage.name)
    private readonly messageModel: Model<ConsultationMessageDocument>,
    private readonly usersService: UsersService,
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

  private toRealtimeConversation(
    conversation: ConsultationConversationDocument | Record<string, any>,
  ): RealtimeConversation {
    return {
      admin: this.toConversationSummary(conversation),
      customer: this.toConversationSummary(conversation, true),
    };
  }

  async authorizeCustomerConversation(
    conversationId: string,
    sessionToken: string | undefined,
    user?: UserDocument | null,
  ) {
    return this.findCustomerConversation(conversationId, sessionToken, user);
  }

  async authorizeAdminConversation(conversationId: string) {
    return this.findAdminConversation(conversationId);
  }

  async getRealtimeConversationSummary(conversationId: string): Promise<RealtimeConversation | null> {
    if (!Types.ObjectId.isValid(conversationId)) return null;
    const conversation = await this.conversationModel.findById(conversationId).exec();
    return conversation ? this.toRealtimeConversation(conversation) : null;
  }

  async markConversationRead(
    conversationId: string,
    reader: 'admin' | 'customer',
  ): Promise<RealtimeConversation | null> {
    if (!Types.ObjectId.isValid(conversationId)) return null;
    const now = new Date();
    const unreadField = reader === 'admin' ? 'unreadForAdmin' : 'unreadForGuest';
    const readAtField = reader === 'admin' ? 'lastCustomerMessageReadAt' : 'lastAdminMessageReadAt';
    const conversation = await this.conversationModel.findOneAndUpdate(
      { _id: conversationId, [unreadField]: { $gt: 0 } },
      { $set: { [unreadField]: 0, [readAtField]: now } },
      { new: true },
    ).exec();
    return conversation ? this.toRealtimeConversation(conversation) : null;
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
    return (await this.startConversationRealtime(sessionToken, dto, user)).conversation.customer;
  }

  async startConversationRealtime(
    sessionToken: string | undefined,
    dto: StartConsultationConversationDto,
    user?: UserDocument | null,
  ): Promise<RealtimeConversationStart> {
    const sessionTokenHash = this.getSessionHash(sessionToken);
    const subject = dto.subject.trim();
    const userId = this.getUserId(user);
    const fullName = user?.fullName?.trim();
    const guestName = userId
      ? fullName || user?.username?.trim() || user?.phone?.trim()
      : dto.guestName?.trim();
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

    const now = new Date();
    const closedConversations: RealtimeConversation[] = [];
    if (existingRequest) {
      const closedPendingRequest = await this.conversationModel.findOneAndUpdate(
        { _id: existingRequest._id, status: ConsultationConversationStatus.PENDING },
        { $set: {
          status: ConsultationConversationStatus.CLOSED,
          closedAt: now,
          closedByAdminId: null,
          closedByAdminName: '',
          unreadForAdmin: 0,
        } },
        { new: true },
      ).exec();
      if (closedPendingRequest) closedConversations.push(this.toRealtimeConversation(closedPendingRequest));
    }

    const openFilter = {
      $or: [
        { sessionTokenHash },
        ...(userId ? [{ userId }] : []),
      ],
      status: ConsultationConversationStatus.OPEN,
    };
    const openConversations = await this.conversationModel.find(openFilter).exec();
    await this.conversationModel.updateMany(openFilter, {
      $set: {
        status: ConsultationConversationStatus.CLOSED,
        closedAt: now,
        closedByAdminId: null,
        closedByAdminName: '',
      },
    });
    closedConversations.push(...openConversations.map((conversation) => {
      conversation.status = ConsultationConversationStatus.CLOSED;
      conversation.closedAt = now;
      conversation.closedByAdminId = null;
      conversation.closedByAdminName = '';
      return this.toRealtimeConversation(conversation);
    }));

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
      return {
        conversation: this.toRealtimeConversation(conversation),
        closedConversations,
      };
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      const pending = await this.conversationModel
        .findOne({ ...ownerFilter, status: ConsultationConversationStatus.PENDING })
        .sort({ createdAt: -1 })
        .exec();
      if (pending) {
        return { conversation: this.toRealtimeConversation(pending), closedConversations };
      }
      throw error;
    }
  }

  async startAdminConversationRealtime(
    dto: StartAdminConsultationConversationDto,
    admin: UserDocument,
  ): Promise<RealtimeConversationStart> {
    if (admin?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('فقط ادمین می‌تواند برای کاربر گفت‌وگو ایجاد کند.');
    }
    if (!Types.ObjectId.isValid(dto.userId)) {
      throw new BadRequestException('شناسهٔ کاربر معتبر نیست.');
    }
    const subject = dto.subject.trim();
    if (subject.length < 3 || subject.length > 120) {
      throw new BadRequestException('موضوع گفت‌وگو باید بین ۳ تا ۱۲۰ حرف باشد.');
    }

    const user = await this.usersService.findById(dto.userId);
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('گفت‌وگو فقط برای حساب کاربری مشتری قابل ایجاد است.');
    }
    const userId = this.getUserId(user);
    if (!userId) throw new NotFoundException('کاربر پیدا نشد.');

    const ownerFilter = { userId };
    const existingOpen = await this.conversationModel
      .findOne({ ...ownerFilter, status: ConsultationConversationStatus.OPEN })
      .sort({ lastMessageAt: -1 })
      .exec();
    if (existingOpen) {
      return {
        conversation: this.toRealtimeConversation(existingOpen),
        closedConversations: [],
        reused: true,
      };
    }

    const existingPending = await this.conversationModel
      .findOne({ ...ownerFilter, status: ConsultationConversationStatus.PENDING })
      .sort({ createdAt: -1 })
      .exec();
    if (existingPending) {
      const promoted = await this.conversationModel.findOneAndUpdate(
        { _id: existingPending._id, status: ConsultationConversationStatus.PENDING },
        {
          $set: {
            status: ConsultationConversationStatus.OPEN,
            subject,
            lastMessageAt: new Date(),
            closedAt: null,
            closedByAdminId: null,
            closedByAdminName: '',
          },
        },
        { new: true },
      ).exec();
      if (promoted) {
        return {
          conversation: this.toRealtimeConversation(promoted),
          closedConversations: [],
          reused: true,
        };
      }
    }

    const sessionToken = randomBytes(32).toString('base64url');
    const sessionTokenHash = createHash('sha256').update(sessionToken).digest('hex');
    const now = new Date();
    try {
      const conversation = await this.conversationModel.create({
        sessionTokenHash,
        userId,
        guestName: user.fullName?.trim() || user.username?.trim() || user.phone?.trim() || 'کاربر',
        subject,
        guestPhone: user.phone?.trim() || '',
        guestEmail: user.email?.trim() || '',
        guestUsername: user.username?.trim() || '',
        guestProvince: user.province?.trim() || '',
        guestCity: user.city?.trim() || '',
        status: ConsultationConversationStatus.OPEN,
        lastMessageAt: now,
      });
      return {
        conversation: this.toRealtimeConversation(conversation),
        closedConversations: [],
        reused: false,
      };
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      const active = await this.conversationModel
        .findOne({ ...ownerFilter, status: ConsultationConversationStatus.OPEN })
        .exec();
      if (active) {
        return {
          conversation: this.toRealtimeConversation(active),
          closedConversations: [],
          reused: true,
        };
      }
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
    return (await this.sendCustomerMessageRealtime(conversationId, sessionToken, dto, user)).customer;
  }

  async sendCustomerMessageRealtime(
    conversationId: string,
    sessionToken: string | undefined,
    dto: SendConsultationMessageDto,
    user?: UserDocument | null,
  ): Promise<RealtimeMessage> {
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
    const updatedConversation = await this.conversationModel.findOneAndUpdate(
      { _id: conversation._id, status: ConsultationConversationStatus.OPEN },
      {
        $set: { lastMessageText: body, lastMessageAt: message.createdAt },
        $inc: { unreadForAdmin: 1 },
      },
      { new: true },
    ).exec();
    if (!updatedConversation) {
      await this.messageModel.deleteOne({ _id: message._id }).exec();
      throw new BadRequestException('این گفت‌وگو دیگر باز نیست. صفحه را تازه کن.');
    }
    return {
      admin: this.toMessageView(message),
      customer: this.toMessageView(message, true),
      conversation: this.toRealtimeConversation(updatedConversation),
    };
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

  async listAdminUserConversations(userId: string) {
    if (!Types.ObjectId.isValid(userId)) throw new BadRequestException('شناسهٔ کاربر معتبر نیست.');
    const conversations = await this.conversationModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('_id subject status createdAt lastMessageAt')
      .sort({ lastMessageAt: -1 })
      .limit(200)
      .exec();
    return conversations.map((conversation) => ({
      id: String(conversation._id),
      subject: conversation.subject || 'مشاوره',
      status: conversation.status,
      createdAt: conversation.createdAt,
      lastMessageAt: conversation.lastMessageAt || conversation.createdAt,
    }));
  }

  async bulkCloseAdminConversations(ids: string[], admin: UserDocument) {
    if (admin?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('فقط ادمین می‌تواند وضعیت گفت‌وگوها را تغییر دهد.');
    }
    if (!Array.isArray(ids) || !ids.length || ids.length > 100 || ids.some((id) => !Types.ObjectId.isValid(id))) {
      throw new BadRequestException('فهرست گفت‌وگوها معتبر نیست.');
    }
    const uniqueIds = [...new Set(ids)];

    const objectIds = uniqueIds.map((id) => new Types.ObjectId(id));
    const conversations = await this.conversationModel
      .find({ _id: { $in: objectIds }, status: { $ne: ConsultationConversationStatus.CLOSED } })
      .exec();
    if (!conversations.length) return [];

    const closedAt = new Date();
    const closedByAdminId = this.getUserId(admin);
    const closedByAdminName = String(admin.fullName || 'ادمین').slice(0, 80);
    await this.conversationModel.updateMany(
      {
        _id: { $in: conversations.map((conversation) => conversation._id) },
        status: { $ne: ConsultationConversationStatus.CLOSED },
      },
      {
        $set: {
          status: ConsultationConversationStatus.CLOSED,
          closedAt,
          closedByAdminId,
          closedByAdminName,
          unreadForAdmin: 0,
        },
      },
    ).exec();

    return conversations.map((conversation) => {
      conversation.status = ConsultationConversationStatus.CLOSED;
      conversation.closedAt = closedAt;
      conversation.closedByAdminId = closedByAdminId;
      conversation.closedByAdminName = closedByAdminName;
      conversation.unreadForAdmin = 0;
      conversation.updatedAt = closedAt;
      return this.toRealtimeConversation(conversation);
    });
  }

  async bulkOpenAdminConversations(ids: string[], admin: UserDocument) {
    if (admin?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('فقط ادمین می‌تواند وضعیت گفت‌وگوها را تغییر دهد.');
    }
    if (!Array.isArray(ids) || !ids.length || ids.length > 100 || ids.some((id) => !Types.ObjectId.isValid(id))) {
      throw new BadRequestException('فهرست گفت‌وگوها معتبر نیست.');
    }

    const objectIds = ids.map((id) => new Types.ObjectId(id));
    const conversations = await this.conversationModel
      .find({ _id: { $in: objectIds }, status: { $in: [ConsultationConversationStatus.CLOSED, ConsultationConversationStatus.PENDING] } })
      .exec();
    if (!conversations.length) return [];

    // The schema allows one open conversation per user/session. Reject a batch that
    // tries to reopen multiple chats for the same owner instead of partially applying it.
    const selectedOwners = new Set<string>();
    for (const conversation of conversations) {
      const ownerKeys = [
        `session:${conversation.sessionTokenHash}`,
        ...(conversation.userId ? [`user:${String(conversation.userId)}`] : []),
      ];
      if (ownerKeys.some((ownerKey) => selectedOwners.has(ownerKey))) {
        throw new BadRequestException('برای هر کاربر فقط یک گفت‌وگو را در هر نوبت بازگشایی گروهی انتخاب کن.');
      }
      ownerKeys.forEach((ownerKey) => selectedOwners.add(ownerKey));
    }

    const ownerFilters = conversations.map((conversation) => conversation.userId
      ? { $or: [{ userId: conversation.userId }, { sessionTokenHash: conversation.sessionTokenHash }] }
      : { sessionTokenHash: conversation.sessionTokenHash, userId: null });
    const selectedObjectIds = conversations.map((conversation) => conversation._id);
    const siblingFilter = {
      $or: ownerFilters,
      _id: { $nin: selectedObjectIds },
      status: ConsultationConversationStatus.OPEN,
    };
    const siblings = await this.conversationModel.find(siblingFilter).exec();
    const adminId = this.getUserId(admin);
    const adminName = String(admin.fullName || 'ادمین').slice(0, 80);
    const now = new Date();

    if (siblings.length) {
      await this.conversationModel.updateMany(
        { _id: { $in: siblings.map((conversation) => conversation._id) }, status: ConsultationConversationStatus.OPEN },
        { $set: {
          status: ConsultationConversationStatus.CLOSED,
          closedAt: now,
          closedByAdminId: adminId,
          closedByAdminName: adminName,
          unreadForAdmin: 0,
        } },
      ).exec();
    }
    await this.conversationModel.updateMany(
      { _id: { $in: selectedObjectIds }, status: { $in: [ConsultationConversationStatus.CLOSED, ConsultationConversationStatus.PENDING] } },
      { $set: {
        status: ConsultationConversationStatus.OPEN,
        closedAt: null,
        closedByAdminId: null,
        closedByAdminName: '',
        unreadForAdmin: 0,
      } },
    ).exec();

    const changedIds = [...siblings.map((conversation) => conversation._id), ...selectedObjectIds];
    const changed = await this.conversationModel.find({ _id: { $in: changedIds } }).exec();
    return changed.map((conversation) => this.toRealtimeConversation(conversation));
  }

  async bulkDeleteAdminConversations(ids: string[], admin: UserDocument) {
    if (admin?.role !== UserRole.ADMIN) throw new ForbiddenException('فقط ادمین می‌تواند گفت‌وگوها را حذف کند.');
    if (!Array.isArray(ids) || !ids.length || ids.length > 100 || ids.some((id) => !Types.ObjectId.isValid(id))) {
      throw new BadRequestException('فهرست گفت‌وگوها معتبر نیست.');
    }

    const objectIds = [...new Set(ids)].map((id) => new Types.ObjectId(id));
    const conversations = await this.conversationModel.find({ _id: { $in: objectIds } }).select({ _id: 1 }).exec();
    const existingIds = conversations.map((conversation) => conversation._id);
    if (!existingIds.length) return { ids: [], deleted: true };

    await this.messageModel.deleteMany({ conversationId: { $in: existingIds } }).exec();
    await this.conversationModel.deleteMany({ _id: { $in: existingIds } }).exec();
    return { ids: existingIds.map(String), deleted: true };
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
    return (await this.sendAdminMessageRealtime(conversationId, admin, dto)).admin;
  }

  async sendAdminMessageRealtime(
    conversationId: string,
    admin: UserDocument,
    dto: SendConsultationMessageDto,
  ): Promise<RealtimeMessage> {
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
    const updatedConversation = await this.conversationModel.findOneAndUpdate(
      { _id: conversation._id, status: ConsultationConversationStatus.OPEN },
      {
        $set: { lastMessageText: body, lastMessageAt: message.createdAt },
        $inc: { unreadForGuest: 1 },
      },
      { new: true },
    ).exec();
    if (!updatedConversation) {
      await this.messageModel.deleteOne({ _id: message._id }).exec();
      throw new BadRequestException('این گفت‌وگو دیگر باز نیست. صفحه را تازه کن.');
    }
    return {
      admin: this.toMessageView(message),
      customer: this.toMessageView(message, true),
      conversation: this.toRealtimeConversation(updatedConversation),
    };
  }

  async updateAdminConversationStatus(
    conversationId: string,
    status: ConsultationConversationStatus.OPEN | ConsultationConversationStatus.CLOSED,
    admin: UserDocument,
  ) {
    return (await this.updateAdminConversationStatusRealtime(conversationId, status, admin)).conversation.admin;
  }

  async updateAdminConversationStatusRealtime(
    conversationId: string,
    status: ConsultationConversationStatus.OPEN | ConsultationConversationStatus.CLOSED,
    admin: UserDocument,
  ): Promise<{ conversation: RealtimeConversation; closedConversations: RealtimeConversation[] }> {
    if (admin?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('فقط ادمین می‌تواند وضعیت گفت‌وگوها را تغییر دهد.');
    }
    const conversation = await this.findAdminConversation(conversationId);
    const adminId = this.getUserId(admin);

    const closedConversations: RealtimeConversation[] = [];
    if (status === ConsultationConversationStatus.OPEN) {
      const ownerFilter = conversation.userId
        ? {
            $or: [
              { userId: conversation.userId },
              { sessionTokenHash: conversation.sessionTokenHash },
            ],
          }
        : { sessionTokenHash: conversation.sessionTokenHash, userId: null };
      const siblingFilter = {
        ...ownerFilter,
        _id: { $ne: conversation._id },
        status: ConsultationConversationStatus.OPEN,
      };
      const siblingConversations = await this.conversationModel.find(siblingFilter).exec();
      const siblingClosedAt = new Date();
      await this.conversationModel.updateMany(siblingFilter, {
        $set: {
          status: ConsultationConversationStatus.CLOSED,
          closedAt: siblingClosedAt,
          closedByAdminId: adminId,
          closedByAdminName: String(admin.fullName || 'ادمین').slice(0, 80),
        },
      });
      for (const sibling of siblingConversations) {
        sibling.status = ConsultationConversationStatus.CLOSED;
        sibling.closedAt = siblingClosedAt;
        sibling.closedByAdminId = adminId;
        sibling.closedByAdminName = String(admin.fullName || 'ادمین').slice(0, 80);
        closedConversations.push(this.toRealtimeConversation(sibling));
      }
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
    return {
      conversation: this.toRealtimeConversation(conversation),
      closedConversations,
    };
  }

  async deleteAdminConversation(conversationId: string, admin: UserDocument) {
    if (admin?.role !== UserRole.ADMIN) throw new ForbiddenException('فقط ادمین می‌تواند گفت‌وگوها را حذف کند.');
    const conversation = await this.findAdminConversation(conversationId);
    await this.conversationModel.deleteOne({ _id: conversation._id }).exec();
    await this.messageModel.deleteMany({ conversationId: conversation._id }).exec();
    return { id: String(conversation._id), deleted: true };
  }
}
