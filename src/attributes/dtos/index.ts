import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateAttributeDto {
  @IsNotEmpty({ message: 'نام ویژگی الزامی است.' })
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsNotEmpty({ message: 'کلید یکتای ویژگی الزامی است.' })
  @IsString()
  key!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  possibleValues?: string[];

  @IsOptional()
  @IsString()
  unit?: string;
}

export class QuickCreateAttributeDto {
  @IsNotEmpty({ message: 'نام ویژگی الزامی است.' })
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  unit?: string;
}

export class UpdateAttributeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  possibleValues?: string[];

  @IsOptional()
  @IsString()
  unit?: string;
}
