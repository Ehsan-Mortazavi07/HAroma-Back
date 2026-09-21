import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../common/enums';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username!: string;

  @Prop({ required: false, lowercase: true, trim: true, default: null })
  email?: string;

  @Prop({ trim: true, default: '' })
  phone?: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Prop({ default: false })
  isVip!: boolean;

  @Prop({ type: Date, default: null })
  vipExpiresAt?: Date | null;

  @Prop({ default: '' })
  avatar?: string;

  @Prop({ type: String, default: null })
  birthDate?: string | null;

  @Prop({ type: String, default: null })
  birthDateShamsi?: string | null;

  @Prop({ trim: true, default: '' })
  province?: string;

  @Prop({ trim: true, default: '' })
  city?: string;

  @Prop({ trim: true, default: '' })
  address?: string;

  @Prop({ trim: true, default: '' })
  postalCode?: string;

  @Prop({ trim: true, default: '' })
  buildingNumber?: string;

  @Prop({ trim: true, default: '' })
  unit?: string;

  @Prop({ trim: true, default: '' })
  recipientName?: string;

  @Prop({ trim: true, default: '' })
  recipientPhone?: string;

  @Prop({ trim: true, default: '' })
  recipientEmail?: string;

  @Prop({ trim: true, default: '' })
  addressNotes?: string;

  @Prop({ default: false })
  deleted!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index(
  { email: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { email: { $type: 'string', $gt: '' } },
  },
);
UserSchema.index({ phone: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ deleted: 1 });
