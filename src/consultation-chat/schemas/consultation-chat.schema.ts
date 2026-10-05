import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConsultationConversationDocument = ConsultationConversation & Document;
export type ConsultationMessageDocument = ConsultationMessage & Document;

export enum ConsultationConversationStatus {
  PENDING = 'pending',
  OPEN = 'open',
  CLOSED = 'closed',
}

export enum ConsultationMessageSender {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class ConsultationConversation {
  createdAt!: Date;
  updatedAt!: Date;

  @Prop({ required: true })
  sessionTokenHash!: string;

  @Prop({ trim: true, default: 'مشتری مهمان', maxlength: 80 })
  guestName!: string;

  @Prop({ trim: true, required: true, maxlength: 120, default: 'مشاوره' })
  subject!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  userId?: Types.ObjectId | null;

  @Prop({ trim: true, default: '', maxlength: 40 })
  guestPhone!: string;

  @Prop({ trim: true, lowercase: true, default: '', maxlength: 160 })
  guestEmail!: string;

  @Prop({ trim: true, default: '', maxlength: 40 })
  guestUsername!: string;

  @Prop({ trim: true, default: '', maxlength: 80 })
  guestProvince!: string;

  @Prop({ trim: true, default: '', maxlength: 80 })
  guestCity!: string;

  @Prop({ type: String, enum: ConsultationConversationStatus, default: ConsultationConversationStatus.OPEN })
  status!: ConsultationConversationStatus;

  @Prop({ type: Date, default: null })
  closedAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  closedByAdminId?: Types.ObjectId | null;

  @Prop({ trim: true, default: '', maxlength: 80 })
  closedByAdminName!: string;

  @Prop({ trim: true, default: '' })
  lastMessageText!: string;

  @Prop({ type: Date, default: Date.now })
  lastMessageAt!: Date;

  @Prop({ type: Number, default: 0, min: 0 })
  unreadForAdmin!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  unreadForGuest!: number;

  @Prop({ type: Date, default: null })
  lastCustomerMessageReadAt?: Date | null;

  @Prop({ type: Date, default: null })
  lastAdminMessageReadAt?: Date | null;
}

export const ConsultationConversationSchema = SchemaFactory.createForClass(ConsultationConversation);
ConsultationConversationSchema.index({ sessionTokenHash: 1, createdAt: -1 });
ConsultationConversationSchema.index(
  { sessionTokenHash: 1 },
  { unique: true, partialFilterExpression: { status: ConsultationConversationStatus.OPEN } },
);
ConsultationConversationSchema.index({ status: 1, lastMessageAt: -1 });
ConsultationConversationSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      userId: { $type: 'objectId' },
      status: ConsultationConversationStatus.OPEN,
    },
  },
);
ConsultationConversationSchema.index(
  { userId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      userId: { $type: 'objectId' },
      status: ConsultationConversationStatus.PENDING,
    },
  },
);
ConsultationConversationSchema.index(
  { sessionTokenHash: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      userId: null,
      status: ConsultationConversationStatus.PENDING,
    },
  },
);

@Schema({ timestamps: true })
export class ConsultationMessage {
  createdAt!: Date;
  updatedAt!: Date;

  @Prop({ type: Types.ObjectId, ref: ConsultationConversation.name, required: true, index: true })
  conversationId!: Types.ObjectId;

  @Prop({ type: String, enum: ConsultationMessageSender, required: true })
  senderRole!: ConsultationMessageSender;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  senderId?: Types.ObjectId | null;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  senderName!: string;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  body!: string;
}

export const ConsultationMessageSchema = SchemaFactory.createForClass(ConsultationMessage);
ConsultationMessageSchema.index({ conversationId: 1, _id: 1 });
