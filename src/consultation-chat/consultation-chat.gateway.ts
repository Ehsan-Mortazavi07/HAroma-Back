import { createAdapter } from '@socket.io/mongo-adapter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  Ack,
} from '@nestjs/websockets';
import { BadRequestException, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Namespace, Socket } from 'socket.io';
import { UserRole } from '../common/enums';
import { UsersService } from '../users/users.service';
import type { UserDocument } from '../users/schemas/user.schema';
import {
  SendConsultationMessageDto,
  StartAdminConsultationConversationDto,
  StartConsultationConversationDto,
  UpdateConsultationConversationStatusDto,
} from './dtos/consultation-chat.dto';
import { ConsultationChatService, RealtimeConversation, RealtimeMessage } from './consultation-chat.service';

const ADMIN_INBOX_ROOM = 'consultation:admin-inbox';
const ADMIN_CONVERSATION_ROOM = (id: string) => `consultation:admin:${id}`;
const CUSTOMER_CONVERSATION_ROOM = (id: string) => `consultation:customer:${id}`;
const CUSTOMER_USER_ROOM = (id: string) => `consultation:user:${id}`;
const MESSAGE_RATE_LIMIT = 60;

type SocketAck<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type ChatSocket = Socket & {
  data: {
    role?: 'admin' | 'customer';
    user?: UserDocument | null;
    sessionToken?: string;
    rateWindows?: Record<string, { start: number; count: number }>;
    activeConversationId?: string;
  };
};

function allowedSocketOrigins(): string[] {
  return String(process.env.CORS_ORIGINS || 'http://localhost:7732,http://127.0.0.1:7732')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

@WebSocketGateway({
  namespace: '/consultation-chat',
  transports: ['websocket'],
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedSocketOrigins().includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin is not allowed by CORS.'), false);
    },
    credentials: true,
  },
  allowRequest: (request, callback) => {
    const origin = request.headers.origin;
    callback(null, !origin || allowedSocketOrigins().includes(origin));
  },
  maxHttpBufferSize: 32 * 1024,
  pingInterval: 25_000,
  pingTimeout: 20_000,
})
export class ConsultationChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private namespace!: Namespace;

  private readonly logger = new Logger(ConsultationChatGateway.name);
  private mongoAdapterSetup?: Promise<void>;

  constructor(
    private readonly chatService: ConsultationChatService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  afterInit(namespace: Namespace) {
    this.namespace = namespace;
    namespace.use((socket, next) => {
      void this.authenticate(socket as ChatSocket).then(() => next()).catch((error) => {
        const socketError = new Error(this.errorMessage(error)) as Error & { data?: unknown };
        socketError.data = { code: 'CHAT_AUTH_REQUIRED' };
        next(socketError);
      });
    });
  }

  handleConnection(client: ChatSocket) {
    if (client.data.role === 'admin') {
      void client.join(ADMIN_INBOX_ROOM);
    } else if (client.data.user?._id) {
      void client.join(CUSTOMER_USER_ROOM(String(client.data.user._id)));
    }
  }

  handleDisconnect(client: ChatSocket) {
    client.data.activeConversationId = undefined;
  }

  /**
   * Shares Socket.IO room broadcasts between backend instances when MongoDB
   * supports change streams (Atlas/replica set/sharded cluster). Standalone
   * local MongoDB keeps the default in-memory adapter.
   */
  initializeMongoAdapter(): Promise<void> {
    this.mongoAdapterSetup ??= this.configureMongoAdapter();
    return this.mongoAdapterSetup;
  }

  private async configureMongoAdapter() {
    try {
      const topologyType = (this.mongoConnection.getClient() as any).topology?.description?.type;
      if (!['ReplicaSetWithPrimary', 'ReplicaSetNoPrimary', 'Sharded'].includes(topologyType)) {
        this.logger.warn('MongoDB is standalone; Socket.IO broadcasts are local to this backend instance.');
        return;
      }

      const db = this.mongoConnection.db;
      if (!db) throw new Error('MongoDB connection is not ready.');
      const collection = db.collection('consultation_chat_socket_events');
      await collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });
      this.namespace.adapter = createAdapter(collection, {
        addCreatedAtField: true,
        heartbeatInterval: 60_000,
        heartbeatTimeout: 150_000,
      })(this.namespace);
      this.logger.log('MongoDB change-stream adapter enabled for multi-instance chat delivery.');
    } catch (error) {
      this.logger.warn(`MongoDB Socket.IO adapter unavailable; using local adapter (${this.errorMessage(error)}).`);
    }
  }

  private async authenticate(client: ChatSocket) {
    await this.initializeMongoAdapter();

    const sessionToken = String(client.handshake.auth?.sessionToken || '');
    const cookieToken = this.readCookie(client.handshake.headers.cookie, 'hatefaroma_token');
    let user: UserDocument | null = null;

    if (cookieToken) {
      try {
        const payload = await this.jwtService.verifyAsync<{ sub?: string; tokenVersion?: number }>(cookieToken);
        if (payload.sub) {
          const candidate = await this.usersService.findById(payload.sub);
          if (
            candidate &&
            !candidate.deleted &&
            (payload.tokenVersion ?? 0) === (candidate.tokenVersion ?? 0)
          ) {
            user = candidate;
          }
        }
      } catch {
        // Public consultation chat supports guests; an invalid optional cookie is ignored.
      }
    }

    if (user?.role === UserRole.ADMIN) {
      client.data.role = 'admin';
      client.data.user = user;
      client.data.sessionToken = sessionToken || undefined;
      return;
    }

    if (!/^[A-Za-z0-9_-]{40,100}$/.test(sessionToken)) {
      throw new UnauthorizedException('نشست گفت‌وگو معتبر نیست. صفحه را تازه‌سازی کن.');
    }
    client.data.role = 'customer';
    client.data.user = user;
    client.data.sessionToken = sessionToken;
  }

  private readCookie(cookieHeader: string | undefined, name: string): string | null {
    const entry = cookieHeader
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`));
    if (!entry) return null;
    const value = entry.slice(name.length + 1);
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  private errorMessage(error: unknown): string {
    const value = error as any;
    const response = value?.getResponse?.();
    if (typeof response === 'string') return response;
    if (Array.isArray(response?.message)) return response.message.join('، ');
    if (typeof response?.message === 'string') return response.message;
    return typeof value?.message === 'string' ? value.message : 'درخواست چت انجام نشد. دوباره تلاش کن.';
  }

  private acknowledge<T>(ack: ((response: SocketAck<T>) => void) | undefined, data: T) {
    ack?.({ ok: true, data });
  }

  private reject<T>(ack: ((response: SocketAck<T>) => void) | undefined, error: unknown) {
    ack?.({ ok: false, error: this.errorMessage(error) });
  }

  private enforceRateLimit(client: ChatSocket, key: string, limit = MESSAGE_RATE_LIMIT) {
    const now = Date.now();
    const rateWindows = client.data.rateWindows || (client.data.rateWindows = {});
    const window = rateWindows[key];
    if (!window || now - window.start >= 60_000) {
      rateWindows[key] = { start: now, count: 1 };
      return;
    }
    if (window.count >= limit) {
      throw new Error('تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کن.');
    }
    window.count += 1;
  }

  private emitConversationUpdate(conversation: RealtimeConversation) {
    const id = conversation.admin.id;
    this.namespace.to(ADMIN_INBOX_ROOM).emit('conversation:updated', conversation.admin);
    this.namespace.to(ADMIN_CONVERSATION_ROOM(id)).emit('conversation:updated', conversation.admin);
    if (conversation.admin.userId) {
      this.namespace
        .to(CUSTOMER_CONVERSATION_ROOM(id))
        .to(CUSTOMER_USER_ROOM(conversation.admin.userId))
        .emit('conversation:updated', conversation.customer);
    } else {
      this.namespace.to(CUSTOMER_CONVERSATION_ROOM(id)).emit('conversation:updated', conversation.customer);
    }
  }

  emitConversationUpdates(conversations: RealtimeConversation[]) {
    for (const conversation of conversations) this.emitConversationUpdate(conversation);
  }

  emitConversationDeleted(conversationId: string) {
    this.namespace.to(ADMIN_INBOX_ROOM).emit('conversation:deleted', { id: conversationId });
    this.namespace.to(ADMIN_CONVERSATION_ROOM(conversationId)).emit('conversation:deleted', { id: conversationId });
    this.namespace.to(CUSTOMER_CONVERSATION_ROOM(conversationId)).emit('conversation:deleted', { id: conversationId });
  }

  publishRealtimeMessage(result: RealtimeMessage) {
    const id = result.admin.conversationId;
    this.namespace.to(ADMIN_CONVERSATION_ROOM(id)).emit('message:new', result.admin);
    if (result.conversation.admin.userId) {
      this.namespace
        .to(CUSTOMER_CONVERSATION_ROOM(id))
        .to(CUSTOMER_USER_ROOM(result.conversation.admin.userId))
        .emit('message:new', result.customer);
    } else {
      this.namespace.to(CUSTOMER_CONVERSATION_ROOM(id)).emit('message:new', result.customer);
    }
    this.emitConversationUpdate(result.conversation);
  }

  private emitCustomerConversationCreated(conversation: RealtimeConversation) {
    const userId = conversation.admin.userId;
    if (userId) {
      this.namespace.to(CUSTOMER_USER_ROOM(userId)).emit('conversation:created', conversation.customer);
    }
  }

  @SubscribeMessage('conversation:join')
  async joinConversation(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() payload: { conversationId?: string },
    @Ack() ack?: (response: SocketAck<{ joined: boolean }>) => void,
  ) {
    try {
      const conversationId = String(payload?.conversationId || '');
      if (client.data.role === 'admin') {
        await this.chatService.authorizeAdminConversation(conversationId);
      } else {
        await this.chatService.authorizeCustomerConversation(
          conversationId,
          client.data.sessionToken,
          client.data.user,
        );
      }

      if (client.data.activeConversationId) {
        await client.leave(
          client.data.role === 'admin'
            ? ADMIN_CONVERSATION_ROOM(client.data.activeConversationId)
            : CUSTOMER_CONVERSATION_ROOM(client.data.activeConversationId),
        );
      }
      if (client.data.role === 'admin') {
        await client.join(ADMIN_CONVERSATION_ROOM(conversationId));
      } else {
        await client.join(CUSTOMER_CONVERSATION_ROOM(conversationId));
      }
      client.data.activeConversationId = conversationId;
      this.acknowledge(ack, { joined: true });
    } catch (error) {
      this.reject(ack, error);
    }
  }

  @SubscribeMessage('conversation:read')
  async markConversationRead(@ConnectedSocket() client: ChatSocket) {
    const conversationId = client.data.activeConversationId;
    if (!conversationId || !client.data.role) return;
    try {
      const summary = await this.chatService.markConversationRead(conversationId, client.data.role);
      if (summary) this.emitConversationUpdate(summary);
    } catch (error) {
      this.logger.warn(`Unable to update chat read state (${this.errorMessage(error)}).`);
    }
  }

  @SubscribeMessage('conversation:start')
  async startConversation(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() dto: StartConsultationConversationDto,
    @Ack() ack?: (response: SocketAck<RealtimeConversation['customer']>) => void,
  ) {
    try {
      if (client.data.role !== 'customer') throw new Error('درخواست مشاوره از حساب ادمین قابل ثبت نیست.');
      this.enforceRateLimit(client, 'conversation:start', 10);
      if (typeof dto?.subject !== 'string' || dto.subject.trim().length < 3 || dto.subject.length > 120) {
        throw new BadRequestException('موضوع گفت‌وگو را بنویس (۳ تا ۱۲۰ حرف).');
      }
      if (dto.guestName !== undefined && (typeof dto.guestName !== 'string' || dto.guestName.length > 80)) {
        throw new BadRequestException('نام واردشده معتبر نیست.');
      }
      const result = await this.chatService.startConversationRealtime(
        client.data.sessionToken,
        dto,
        client.data.user,
      );
      this.emitConversationUpdates([...result.closedConversations, result.conversation]);
      this.acknowledge(ack, result.conversation.customer);
    } catch (error) {
      this.reject(ack, error);
    }
  }

  @SubscribeMessage('conversation:create-for-user')
  async createConversationForUser(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() payload: StartAdminConsultationConversationDto,
    @Ack() ack?: (response: SocketAck<{ conversation: RealtimeConversation['admin']; reused: boolean }>) => void,
  ) {
    try {
      if (client.data.role !== 'admin') {
        throw new UnauthorizedException('فقط ادمین می‌تواند برای کاربر گفت‌وگو ایجاد کند.');
      }
      this.enforceRateLimit(client, 'conversation:create-for-user', 10);
      if (
        typeof payload?.userId !== 'string' ||
        !/^[a-f\d]{24}$/i.test(payload.userId) ||
        typeof payload?.subject !== 'string' ||
        payload.subject.trim().length < 3 ||
        payload.subject.length > 120
      ) {
        throw new BadRequestException('کاربر و موضوع گفت‌وگو را به‌درستی انتخاب کن.');
      }

      const result = await this.chatService.startAdminConversationRealtime(
        payload,
        client.data.user as UserDocument,
      );
      this.emitConversationUpdates([...result.closedConversations, result.conversation]);
      this.emitCustomerConversationCreated(result.conversation);
      this.acknowledge(ack, {
        conversation: result.conversation.admin,
        reused: Boolean(result.reused),
      });
    } catch (error) {
      this.reject(ack, error);
    }
  }

  @SubscribeMessage('message:send')
  async sendMessage(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() payload: { conversationId?: string; body?: string },
    @Ack() ack?: (response: SocketAck<RealtimeMessage['admin'] | RealtimeMessage['customer']>) => void,
  ) {
    try {
      this.enforceRateLimit(client, 'message:send');
      if (
        typeof payload?.body !== 'string' ||
        !payload.body.trim() ||
        payload.body.length > 2000 ||
        typeof payload?.conversationId !== 'string'
      ) {
        throw new BadRequestException('متن پیام معتبر نیست.');
      }
      const dto = payload as SendConsultationMessageDto;
      const result = client.data.role === 'admin'
        ? await this.chatService.sendAdminMessageRealtime(
            String(payload?.conversationId || ''),
            client.data.user as UserDocument,
            dto,
          )
        : await this.chatService.sendCustomerMessageRealtime(
            String(payload?.conversationId || ''),
            client.data.sessionToken,
            dto,
            client.data.user,
          );
      this.publishRealtimeMessage(result);
      this.acknowledge(ack, client.data.role === 'admin' ? result.admin : result.customer);
    } catch (error) {
      this.reject(ack, error);
    }
  }

  @SubscribeMessage('conversation:status')
  async updateConversationStatus(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() payload: { conversationId?: string; status?: UpdateConsultationConversationStatusDto['status'] },
    @Ack() ack?: (response: SocketAck<RealtimeConversation['admin']>) => void,
  ) {
    try {
      if (client.data.role !== 'admin') throw new UnauthorizedException('فقط ادمین می‌تواند وضعیت گفت‌وگو را تغییر دهد.');
      this.enforceRateLimit(client, 'conversation:status');
      if (!['open', 'closed'].includes(String(payload?.status))) {
        throw new BadRequestException('وضعیت گفت‌وگو معتبر نیست.');
      }
      const result = await this.chatService.updateAdminConversationStatusRealtime(
        String(payload?.conversationId || ''),
        payload?.status as UpdateConsultationConversationStatusDto['status'],
        client.data.user as UserDocument,
      );
      this.emitConversationUpdates([...result.closedConversations, result.conversation]);
      this.acknowledge(ack, result.conversation.admin);
    } catch (error) {
      this.reject(ack, error);
    }
  }

  @SubscribeMessage('conversation:delete')
  async deleteConversation(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() payload: { conversationId?: string },
    @Ack() ack?: (response: SocketAck<{ id: string; deleted: boolean }>) => void,
  ) {
    try {
      if (client.data.role !== 'admin') throw new UnauthorizedException('فقط ادمین می‌تواند گفت‌وگوها را حذف کند.');
      this.enforceRateLimit(client, 'conversation:delete');
      const result = await this.chatService.deleteAdminConversation(
        String(payload?.conversationId || ''),
        client.data.user as UserDocument,
      );
      this.emitConversationDeleted(result.id);
      this.acknowledge(ack, result);
    } catch (error) {
      this.reject(ack, error);
    }
  }
}
