import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsNumber,
  MinLength,
} from 'class-validator';
import { CertificateType } from '../users/student.entity';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6) // Add password validation if allowing updates
  password?: string;

  @IsOptional()
  dateOfBirth?: Date;

  @IsOptional()
  @IsString()
  government?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString() // Add validation as needed (e.g., phone number format)
  phoneNumber?: string;

  @IsOptional()
  @IsString() // Consider using IsEnum if you define a Gender enum
  gender?: string;

  @IsOptional()
  @IsString() // Consider using IsEnum
  preferredCommunication?: string;

  // Student specific fields
  @IsOptional()
  @IsEnum(CertificateType)
  certificateType?: CertificateType;

  @IsOptional()
  @IsNumber()
  totalScore?: number;

  @IsOptional()
  @IsString()
  nationality?: string;

  // Add advisor specific fields if needed
}
