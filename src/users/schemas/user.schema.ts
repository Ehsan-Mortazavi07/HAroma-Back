import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../../common/enums';
import { addressTitleKey, normalizeAddressTitle } from '../address-title.util';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class UserAddress {
  @Prop({ type: String, default: () => new Types.ObjectId().toString() })
  _id!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  province!: string;

  @Prop({ required: true, trim: true })
  city!: string;

  @Prop({ required: true, trim: true })
  address!: string;

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
  isDefault!: boolean;
}

export const UserAddressSchema = SchemaFactory.createForClass(UserAddress);

function hasUniqueAddressTitles(addresses: Array<{ title?: string | null }> = []) {
  const keys = addresses.map((address) => addressTitleKey(address.title));
  return keys.every(Boolean) && new Set(keys).size === keys.length;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username!: string;

  @Prop({ required: false, lowercase: true, trim: true, default: null })
  email?: string;

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({ trim: true, default: '' })
  phone?: string;

  @Prop({ default: false })
  isPhoneVerified!: boolean;

  @Prop({ required: false, default: '' })
  password?: string;

  @Prop({ default: 0, min: 0 })
  tokenVersion!: number;

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

  @Prop({
    type: [UserAddressSchema],
    default: [],
    validate: {
      validator: hasUniqueAddressTitles,
      message: 'عنوان آدرس‌های یک کاربر باید یکتا باشد.',
    },
  })
  addresses!: UserAddress[];

  hasPassword?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('validate', function () {
  const user = this as UserDocument;
  const usedTitles = new Set<string>();
  (user.addresses || []).forEach((address, index) => {
    if (!normalizeAddressTitle(address.title)) {
      let title = `نشانی ${index + 1}`;
      let suffix = 2;
      while (usedTitles.has(addressTitleKey(title))) {
        title = `نشانی ${index + 1} (${suffix++})`;
      }
      address.title = title;
    }
    usedTitles.add(addressTitleKey(address.title));
  });
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.hasPassword = Boolean(ret.password && ret.password.trim());
    delete ret.password;
    delete ret.tokenVersion;
    return ret;
  },
});

UserSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.hasPassword = Boolean(ret.password && ret.password.trim());
    delete ret.password;
    delete ret.tokenVersion;
    return ret;
  },
});

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
