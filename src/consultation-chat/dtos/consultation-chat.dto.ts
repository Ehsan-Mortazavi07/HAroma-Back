import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ConsultationConversationStatus } from '../schemas/consultation-chat.schema';

export class StartConsultationConversationDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  guestName?: string;
}

export class SendConsultationMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}

export class UpdateConsultationConversationStatusDto {
  @IsString()
  @IsIn(Object.values(ConsultationConversationStatus))
  status!: ConsultationConversationStatus;
}
