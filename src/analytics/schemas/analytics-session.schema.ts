import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type AnalyticsSessionDocument = AnalyticsSession & Document;

/** One browsing visit; a new session starts after 30 minutes of inactivity. */
@Schema({ timestamps: false, collection: 'analytics_sessions' })
export class AnalyticsSession {
  @Prop({ required: true, unique: true })
  sessionId!: string;

  @Prop({ required: true })
  visitorId!: string;

  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  user?: Types.ObjectId | null;

  @Prop({ type: Date, required: true })
  startedAt!: Date;

  @Prop({ type: Date, required: true })
  lastSeenAt!: Date;

  /** Engaged seconds (tab visible and user not idle) across all page views. */
  @Prop({ default: 0, min: 0 })
  duration!: number;

  @Prop({ default: 0, min: 0 })
  pageViews!: number;

  @Prop({ default: '' })
  landingPath!: string;

  @Prop({ default: '' })
  exitPath!: string;

  @Prop({ default: '(direct)' })
  referrer!: string;

  @Prop({ default: '' })
  utmSource!: string;

  @Prop({ default: '' })
  utmCampaign!: string;

  @Prop({ default: 'desktop' })
  device!: string;

  @Prop({ default: 'other' })
  browser!: string;

  @Prop({ default: 'other' })
  os!: string;

  @Prop({ default: true })
  isNewVisitor!: boolean;
}

export const AnalyticsSessionSchema = SchemaFactory.createForClass(AnalyticsSession);
AnalyticsSessionSchema.index({ startedAt: -1 });
AnalyticsSessionSchema.index({ lastSeenAt: -1 });
AnalyticsSessionSchema.index({ visitorId: 1, startedAt: -1 });
AnalyticsSessionSchema.index({ user: 1, startedAt: -1 });
