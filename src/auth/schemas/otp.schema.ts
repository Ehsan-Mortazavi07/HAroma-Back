import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: true })
export class Otp {
  @Prop({ required: false, index: true, trim: true })
  phone?: string;

  @Prop({ required: false, index: true, trim: true, lowercase: true })
  email?: string;

  @Prop({ required: true, enum: ['sms', 'email'] })
  channel!: 'sms' | 'email';

  @Prop({ required: true, enum: ['login', 'register', 'verify-phone', 'reset-password'], index: true })
  purpose!: 'login' | 'register' | 'verify-phone' | 'reset-password';

  @Prop({ required: true, select: false })
  codeHash!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: false })
  used!: boolean;

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ default: 0 })
  attempts!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// Automatically remove OTP documents after 1 hour (3600 seconds)
OtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });
OtpSchema.index({ phone: 1, used: 1 });
OtpSchema.index({ email: 1, used: 1 });
OtpSchema.index({ purpose: 1, used: 1 });
