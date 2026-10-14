import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
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
  ConsultationConversationHistoryAction,
  ConsultationConversationHistoryActorRole,
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
  statusHistory: ConversationHistoryEvent[];
  createdAt: Date;
  updatedAt: Date;
};

type ConversationHistoryEvent = {
  action: ConsultationConversationHistoryAction;
  fromStatus: ConsultationConversationStatus | null;
  toStatus: ConsultationConversationStatus | null;
  actorRole: ConsultationConversationHistoryActorRole;
  actorId: string | null;
  actorName: string;
  occurredAt: Date;
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
export class ConsultationChatService implements OnModuleInit {
  private readonly logger = new Logger(ConsultationChatService.name);

  constructor(
    @InjectModel(ConsultationConversation.name)
    private readonly conversationModel: Model<ConsultationConversationDocument>,
    @InjectModel(ConsultationMessage.name)
    private readonly messageModel: Model<ConsultationMessageDocument>,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit() {
    const collection = this.conversationModel.collection;
    await this.conversationModel.createCollection();
    const indexes = await collection.indexes();
    const legacyIndexes = indexes.filter((index) => {
      const partialFilter = index.partialFilterExpression as Record<string, unknown> | undefined;
      const key = index.key as Record<string, number> | undefined;
      const isLegacyUniqueOpenIndex = Boolean(
        index.unique
        && partialFilter?.status === ConsultationConversationStatus.OPEN
        && (key?.userId === 1 || key?.sessionTokenHash === 1),
      );
      const isUserLookupIndex = Boolean(
        key?.userId === 1
        && Object.keys(key).length === 1,
      );
      const isCurrentUserLookupIndex = Boolean(
        isUserLookupIndex
        && index.name === 'consultation_user_lookup'
        && !index.unique
        && !partialFilter,
      );

      return isLegacyUniqueOpenIndex || (isUserLookupIndex && !isCurrentUserLookupIndex);
    });

    for (const index of legacyIndexes) {
      if (!index.name) continue;
      try {
        await collection.dropIndex(index.name);
      } catch (error: any) {
        if (error?.code !== 27 && error?.codeName !== 'IndexNotFound') throw error;
      }
    }

    await this.conversationModel.createIndexes();
    if (legacyIndexes.length) {
      this.logger.log(`Migrated ${legacyIndexes.length} legacy consultation-chat index(es); admins may now approve multiple open chats per customer.`);
    }
  }

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

  private getAdminActor(admin: UserDocument) {
    return {
      actorRole: ConsultationConversationHistoryActorRole.ADMIN,
      actorId: this.getUserId(admin),
      actorName: String(admin.fullName || admin.username || admin.email || 'ادمین').slice(0, 80),
    };
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
    const storedHistory = Array.isArray(conversation.statusHistory)
      ? conversation.statusHistory.map((event: Record<string, any>) => ({
        action: event.action,
        fromStatus: event.fromStatus || null,
        toStatus: event.toStatus || null,
        actorRole: event.actorRole,
        actorId: forCustomer || !event.actorId ? null : String(event.actorId),
        actorName: forCustomer && event.actorRole === ConsultationConversationHistoryActorRole.ADMIN
          ? 'ادمین'
          : event.actorName || '',
        occurredAt: event.occurredAt || conversation.createdAt,
      }))
      : [];
    const hasInitialEvent = storedHistory.some((event) => [
      ConsultationConversationHistoryAction.CREATED,
      ConsultationConversationHistoryAction.REQUESTED,
      ConsultationConversationHistoryAction.OPENED,
    ].includes(event.action));
    const statusHistory: ConversationHistoryEvent[] = forCustomer
      ? []
      : [
        ...(!hasInitialEvent
          ? [{
            action: ConsultationConversationHistoryAction.CREATED,
            fromStatus: null,
            toStatus: null,
            actorRole: ConsultationConversationHistoryActorRole.SYSTEM,
            actorId: null,
            actorName: 'جزئیات پیش از فعال‌شدن تاریخچه ذخیره نشده',
            occurredAt: conversation.createdAt,
          }]
          : []),
        ...storedHistory,
        ...(conversation.status === ConsultationConversationStatus.CLOSED && conversation.closedAt
          && !storedHistory.some((event) => event.action === ConsultationConversationHistoryAction.CLOSED
            && new Date(event.occurredAt).getTime() === new Date(conversation.closedAt).getTime())
          ? [{
            action: ConsultationConversationHistoryAction.CLOSED,
            fromStatus: null,
            toStatus: ConsultationConversationStatus.CLOSED,
            actorRole: conversation.closedByAdminId || conversation.closedByAdminName
              ? ConsultationConversationHistoryActorRole.ADMIN
              : ConsultationConversationHistoryActorRole.SYSTEM,
            actorId: conversation.closedByAdminId ? String(conversation.closedByAdminId) : null,
            actorName: conversation.closedByAdminName || 'ادمین نامشخص',
            occurredAt: conversation.closedAt,
          }]
          : []),
      ];

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
      statusHistory,
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

  async claimGuestConversations(sessionToken: string | undefined, user?: UserDocument | null) {
    const sessionTokenHash = this.getSessionHash(sessionToken);
    const userId = this.getUserId(user);
    if (!userId || user?.deleted) {
      throw new UnauthorizedException('برای انتقال گفتگوهای مهمان ابتدا وارد حساب کاربری شو.');
    }

    const guestConversations = await this.conversationModel
      .find({ sessionTokenHash, userId: null })
      .sort({ createdAt: 1 })
      .exec();
    if (!guestConversations.length) return { claimedCount: 0, conversations: [] as RealtimeConversation[] };

    const guestPending = guestConversations.find(
      (conversation) => conversation.status === ConsultationConversationStatus.PENDING,
    );
    const existingPending = guestPending
      ? await this.conversationModel
          .findOne({ userId, status: ConsultationConversationStatus.PENDING })
          .sort({ createdAt: -1 })
          .exec()
      : null;
    const closedPendingIds: Types.ObjectId[] = [];
    if (guestPending && existingPending) {
      const pendingToClose = guestPending.createdAt >= existingPending.createdAt
        ? existingPending
        : guestPending;
      const closedAt = new Date();
      await this.conversationModel.updateOne(
        { _id: pendingToClose._id, status: ConsultationConversationStatus.PENDING },
        {
          $set: {
            status: ConsultationConversationStatus.CLOSED,
            closedAt,
            closedByAdminId: null,
            closedByAdminName: '',
            unreadForAdmin: 0,
          },
          $push: {
            statusHistory: {
              action: ConsultationConversationHistoryAction.CLOSED,
              fromStatus: ConsultationConversationStatus.PENDING,
              toStatus: ConsultationConversationStatus.CLOSED,
              actorRole: ConsultationConversationHistoryActorRole.SYSTEM,
              actorId: null,
              actorName: 'انتقال گفت‌وگوهای مهمان به حساب کاربری',
              occurredAt: closedAt,
            },
          },
        },
      ).exec();
      closedPendingIds.push(pendingToClose._id);
    }

    const guestIds = guestConversations.map((conversation) => conversation._id);
    const claimedResult = await this.conversationModel.updateMany(
      { _id: { $in: guestIds }, sessionTokenHash, userId: null },
      { $set: { userId } },
    ).exec();
    const changedIds = [...new Set([...guestIds, ...closedPendingIds].map(String))]
      .map((id) => new Types.ObjectId(id));
    const changed = await this.conversationModel.find({ _id: { $in: changedIds } }).exec();

    return {
      claimedCount: claimedResult.modifiedCount || 0,
      conversations: changed.map((conversation) => this.toRealtimeConversation(conversation)),
    };
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
    const isAdminRequester = user?.role === UserRole.ADMIN;
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
    const existingRequest = isAdminRequester
      ? null
      : await this.conversationModel
        .findOne({ ...ownerFilter, status: ConsultationConversationStatus.PENDING })
        .sort({ createdAt: -1 })
        .exec();

    const now = new Date();
    const initialStatus = isAdminRequester
      ? ConsultationConversationStatus.OPEN
      : ConsultationConversationStatus.PENDING;
    const closedConversations: RealtimeConversation[] = [];
    if (!isAdminRequester && existingRequest) {
      const closedPendingRequest = await this.conversationModel.findOneAndUpdate(
        { _id: existingRequest._id, status: ConsultationConversationStatus.PENDING },
        {
          $set: {
            status: ConsultationConversationStatus.CLOSED,
            closedAt: now,
            closedByAdminId: null,
            closedByAdminName: '',
            unreadForAdmin: 0,
          },
          $push: {
            statusHistory: {
              action: ConsultationConversationHistoryAction.CLOSED,
              fromStatus: ConsultationConversationStatus.PENDING,
              toStatus: ConsultationConversationStatus.CLOSED,
              actorRole: ConsultationConversationHistoryActorRole.CUSTOMER,
              actorId: userId,
              actorName: String(guestName).slice(0, 80),
              occurredAt: now,
            },
          },
        },
        { new: true },
      ).exec();
      if (closedPendingRequest) closedConversations.push(this.toRealtimeConversation(closedPendingRequest));
    }

    if (!isAdminRequester) {
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
        $push: {
          statusHistory: {
            action: ConsultationConversationHistoryAction.CLOSED,
            fromStatus: ConsultationConversationStatus.OPEN,
            toStatus: ConsultationConversationStatus.CLOSED,
            actorRole: ConsultationConversationHistoryActorRole.CUSTOMER,
            actorId: userId,
            actorName: String(guestName).slice(0, 80),
            occurredAt: now,
          },
        },
      }).exec();
      closedConversations.push(...openConversations.map((conversation) => {
        conversation.status = ConsultationConversationStatus.CLOSED;
        conversation.closedAt = now;
        conversation.closedByAdminId = null;
        conversation.closedByAdminName = '';
        conversation.statusHistory = [
          ...(conversation.statusHistory || []),
          {
            action: ConsultationConversationHistoryAction.CLOSED,
            fromStatus: ConsultationConversationStatus.OPEN,
            toStatus: ConsultationConversationStatus.CLOSED,
            actorRole: ConsultationConversationHistoryActorRole.CUSTOMER,
            actorId: userId,
            actorName: String(guestName).slice(0, 80),
            occurredAt: now,
          } as any,
        ];
        return this.toRealtimeConversation(conversation);
      }));
    }

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
        status: initialStatus,
        statusHistory: [{
          action: isAdminRequester
            ? ConsultationConversationHistoryAction.OPENED
            : ConsultationConversationHistoryAction.REQUESTED,
          fromStatus: null,
          toStatus: initialStatus,
          ...(isAdminRequester
            ? this.getAdminActor(user as UserDocument)
            : {
              actorRole: ConsultationConversationHistoryActorRole.CUSTOMER,
              actorId: userId,
              actorName: String(guestName).slice(0, 80),
            }),
          occurredAt: now,
        }],
        lastMessageAt: now,
      });
      return {
        conversation: this.toRealtimeConversation(conversation),
        closedConversations,
      };
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      const pending = isAdminRequester ? null : await this.conversationModel
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
      const now = new Date();
      const actor = this.getAdminActor(admin);
      const promoted = await this.conversationModel.findOneAndUpdate(
        { _id: existingPending._id, status: ConsultationConversationStatus.PENDING },
        {
          $set: {
            status: ConsultationConversationStatus.OPEN,
            subject,
            lastMessageAt: now,
            closedAt: null,
            closedByAdminId: null,
            closedByAdminName: '',
          },
          $push: {
            statusHistory: {
              action: ConsultationConversationHistoryAction.ACCEPTED,
              fromStatus: ConsultationConversationStatus.PENDING,
              toStatus: ConsultationConversationStatus.OPEN,
              ...actor,
              occurredAt: now,
            },
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
    const actor = this.getAdminActor(admin);
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
        statusHistory: [{
          action: ConsultationConversationHistoryAction.OPENED,
          fromStatus: null,
          toStatus: ConsultationConversationStatus.OPEN,
          ...actor,
          occurredAt: now,
        }],
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
    const actor = this.getAdminActor(admin);
    await this.conversationModel.bulkWrite(conversations.map((conversation) => ({
      updateOne: {
        filter: { _id: conversation._id, status: conversation.status },
        update: {
          $set: {
            status: ConsultationConversationStatus.CLOSED,
            closedAt,
            closedByAdminId: actor.actorId,
            closedByAdminName: actor.actorName,
            unreadForAdmin: 0,
          },
          $push: {
            statusHistory: {
              action: ConsultationConversationHistoryAction.CLOSED,
              fromStatus: conversation.status,
              toStatus: ConsultationConversationStatus.CLOSED,
              ...actor,
              occurredAt: closedAt,
            },
          },
        },
      },
    })));

    const changed = await this.conversationModel.find({
      _id: { $in: conversations.map((conversation) => conversation._id) },
    }).exec();
    return changed.map((conversation) => this.toRealtimeConversation(conversation));
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
    const selectedObjectIds = conversations.map((conversation) => conversation._id);
    const now = new Date();
    const actor = this.getAdminActor(admin);
    await this.conversationModel.bulkWrite(conversations.map((conversation) => ({
      updateOne: {
        filter: { _id: conversation._id, status: conversation.status },
        update: {
          $set: {
            status: ConsultationConversationStatus.OPEN,
            closedAt: null,
            closedByAdminId: null,
            closedByAdminName: '',
            unreadForAdmin: 0,
          },
          $push: {
            statusHistory: {
              action: conversation.status === ConsultationConversationStatus.PENDING
                ? ConsultationConversationHistoryAction.ACCEPTED
                : ConsultationConversationHistoryAction.REOPENED,
              fromStatus: conversation.status,
              toStatus: ConsultationConversationStatus.OPEN,
              ...actor,
              occurredAt: now,
            },
          },
        },
      },
    })));

    const changed = await this.conversationModel.find({ _id: { $in: selectedObjectIds } }).exec();
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
    if (conversation.status === status) {
      return {
        conversation: this.toRealtimeConversation(conversation),
        closedConversations: [],
      };
    }
    const actor = this.getAdminActor(admin);
    const previousStatus = conversation.status;
    const now = new Date();
    const action = status === ConsultationConversationStatus.CLOSED
      ? ConsultationConversationHistoryAction.CLOSED
      : previousStatus === ConsultationConversationStatus.PENDING
        ? ConsultationConversationHistoryAction.ACCEPTED
        : ConsultationConversationHistoryAction.REOPENED;

    const closedConversations: RealtimeConversation[] = [];
    if (status !== ConsultationConversationStatus.OPEN && status !== ConsultationConversationStatus.CLOSED) {
      throw new BadRequestException('وضعیت درخواستی برای ادمین معتبر نیست.');
    }
    const update: Record<string, any> = {
      $set: {
        status,
        unreadForAdmin: 0,
        ...(status === ConsultationConversationStatus.OPEN
          ? { closedAt: null, closedByAdminId: null, closedByAdminName: '' }
          : { closedAt: now, closedByAdminId: actor.actorId, closedByAdminName: actor.actorName }),
      },
      $push: {
        statusHistory: {
        action,
        fromStatus: previousStatus,
        toStatus: status,
        ...actor,
        occurredAt: now,
        },
      },
    };
    const updatedConversation = await this.conversationModel.findOneAndUpdate(
      { _id: conversation._id, status: previousStatus },
      update,
      { new: true },
    ).exec();
    if (!updatedConversation) {
      throw new ConflictException('وضعیت گفت‌وگو همزمان تغییر کرده است؛ صفحه را تازه کن.');
    }
    return {
      conversation: this.toRealtimeConversation(updatedConversation),
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
