import {
  IsString,
  IsOptional,
  IsUrl,
  IsNumberString,
  MaxLength,
  MinLength,
  IsEmail,
  Matches,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArabicText,
  IsEgyptianPhoneNumber,
} from '../../common/decorators/validation.decorators';

export class UpdateUniversityDto {
  @ApiPropertyOptional({
    description: 'University name (Arabic)',
    example: 'جامعة القاهرة',
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'University name must be a string' })
  @MinLength(2, { message: 'University name must be at least 2 characters' })
  @MaxLength(255, { message: 'University name must not exceed 255 characters' })
  @IsArabicText({ message: 'University name must contain Arabic text' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({
    description: 'University location',
    example: 'Cairo',
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  @MinLength(2, { message: 'Location must be at least 2 characters' })
  @MaxLength(255, { message: 'Location must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  location?: string;

  @ApiPropertyOptional({
    description: 'University type',
    example: 'Public',
    enum: ['Public', 'Private', 'International'],
  })
  @IsOptional()
  @IsString({ message: 'University type must be a string' })
  @IsIn(['Public', 'Private', 'International'], {
    message: 'University type must be Public, Private, or International',
  })
  @Transform(({ value }) => value?.trim())
  type?: string;

  @ApiPropertyOptional({
    description: 'Establishment year',
    example: '1908',
    pattern: '^(19|20)[0-9]{2}$',
  })
  @IsOptional()
  @IsNumberString({}, { message: 'Establishment year must be a valid year' })
  @Matches(/^(19|20)[0-9]{2}$/, {
    message:
      'Establishment year must be a valid 4-digit year between 1900-2099',
  })
  establishment?: string;

  @ApiPropertyOptional({
    description: 'University description',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;

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

  @ApiPropertyOptional({
    description: 'Number of colleges',
    example: '15',
    minimum: 1,
  })
  @IsOptional()
  @IsNumberString({}, { message: 'Colleges count must be a number' })
  @Matches(/^[1-9][0-9]*$/, {
    message: 'Colleges count must be a positive number',
  })
  collegesCount?: string;

  @ApiPropertyOptional({
    description: 'Number of majors',
    example: '120',
    minimum: 1,
  })
  @IsOptional()
  @IsNumberString({}, { message: 'Majors count must be a number' })
  @Matches(/^[1-9][0-9]*$/, {
    message: 'Majors count must be a positive number',
  })
  majorsCount?: string;

  @ApiPropertyOptional({
    description: 'University image URL or path',
    example: 'https://example.com/university-logo.jpg',
  })
  @IsOptional()
  @IsString({ message: 'Image must be a string' })
  @Transform(({ value }) => value?.trim())
  image?: string;
}
