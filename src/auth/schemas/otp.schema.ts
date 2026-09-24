import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: true })
export class Otp {
  @Prop({ required: true, index: true, trim: true })
  phone!: string;

  @Prop({ required: true, trim: true })
  code!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: false })
  used!: boolean;

  @Prop({ default: 0 })
  attempts!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// Automatically remove OTP documents after 15 minutes (900 seconds)
OtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });
OtpSchema.index({ phone: 1, used: 1 });
