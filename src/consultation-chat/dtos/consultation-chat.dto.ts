import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ConsultationConversationStatus } from '../schemas/consultation-chat.schema';

export class StartConsultationConversationDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  subject!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
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
  @IsIn([ConsultationConversationStatus.OPEN, ConsultationConversationStatus.CLOSED])
  status!: ConsultationConversationStatus.OPEN | ConsultationConversationStatus.CLOSED;
}
