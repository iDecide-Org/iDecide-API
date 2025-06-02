import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsNumberString,
  MaxLength,
  MinLength,
  IsEmail,
  Matches,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArabicText,
  IsEgyptianPhoneNumber,
} from '../../common/decorators/validation.decorators';
import { UniversityType } from '../university.entity';

export class CreateUniversityDto {
  @ApiProperty({
    description: 'University name (Arabic)',
    example: 'جامعة القاهرة',
    minLength: 2,
    maxLength: 255,
  })
  @IsString({ message: 'University name must be a string' })
  @IsNotEmpty({ message: 'University name is required' })
  @MinLength(2, { message: 'University name must be at least 2 characters' })
  @MaxLength(255, { message: 'University name must not exceed 255 characters' })
  @IsArabicText({ message: 'University name must contain Arabic text' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'University type',
    example: UniversityType.GOVERNMENTAL,
    enum: UniversityType,
  })
  @IsEnum(UniversityType, {
    message: 'University type must be حكومية, خاصة, or أهلية',
  })
  @Transform(({ value }) => value?.trim())
  type: UniversityType;

  @ApiProperty({
    description: 'University location',
    example: 'Cairo',
    minLength: 2,
    maxLength: 255,
  })
  @IsString({ message: 'Location must be a string' })
  @IsNotEmpty({ message: 'Location is required' })
  @MinLength(2, { message: 'Location must be at least 2 characters' })
  @MaxLength(255, { message: 'Location must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  location: string;

  @ApiPropertyOptional({
    description: 'University description',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiProperty({
    description: 'Establishment year',
    example: '1908',
    pattern: '^[0-9]{4}$',
  })
  @IsNumberString({}, { message: 'Establishment year must be a valid year' })
  @Matches(/^(19|20)[0-9]{2}$/, {
    message:
      'Establishment year must be a valid 4-digit year between 1900-2099',
  })
  establishment: string;

  @ApiPropertyOptional({
    description: 'University website URL',
    example: 'https://cu.edu.eg',
  })
  @IsOptional()
  @IsUrl(
    { protocols: ['http', 'https'] },
    { message: 'Website must be a valid URL' },
  )
  @Transform(({ value }) => value?.trim())
  website?: string;

  @ApiPropertyOptional({
    description: 'University phone number (Egyptian format)',
    example: '+201234567890',
  })
  @IsOptional()
  @IsEgyptianPhoneNumber({
    message: 'Phone number must be a valid Egyptian phone number',
  })
  @Transform(({ value }) => value?.trim())
  phone?: string;

  @ApiPropertyOptional({
    description: 'University email',
    example: 'info@cu.edu.eg',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be valid' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email?: string;

  @ApiProperty({
    description: 'Number of colleges',
    example: '15',
    minimum: 1,
  })
  @IsNumberString({}, { message: 'Colleges count must be a number' })
  @Matches(/^[1-9][0-9]*$/, {
    message: 'Colleges count must be a positive number',
  })
  collegesCount: string;

  @ApiProperty({
    description: 'Number of majors',
    example: '120',
    minimum: 1,
  })
  @IsNumberString({}, { message: 'Majors count must be a number' })
  @Matches(/^[1-9][0-9]*$/, {
    message: 'Majors count must be a positive number',
  })
  majorsCount: string;

  @ApiPropertyOptional({
    description: 'University image URL or path',
    example: 'https://example.com/university-logo.jpg',
  })
  @IsOptional()
  @IsString({ message: 'Image must be a string' })
  @Transform(({ value }) => value?.trim())
  image?: string;
}
