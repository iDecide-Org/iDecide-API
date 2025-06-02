import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsUrl,
  IsOptional,
  IsArray,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ScholarshipType, ScholarshipCoverage } from '../scholarship.entity';

export class CreateScholarshipDto {
  @ApiProperty({
    description: 'Scholarship name',
    example: 'منحة التفوق الأكاديمي',
    minLength: 2,
    maxLength: 255,
  })
  @IsString({ message: 'Scholarship name must be a string' })
  @IsNotEmpty({ message: 'Scholarship name is required' })
  @MinLength(2, { message: 'Scholarship name must be at least 2 characters' })
  @MaxLength(255, {
    message: 'Scholarship name must not exceed 255 characters',
  })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'Scholarship provider',
    example: 'Ministry of Higher Education',
    minLength: 2,
    maxLength: 255,
  })
  @IsString({ message: 'Provider must be a string' })
  @IsNotEmpty({ message: 'Provider is required' })
  @MinLength(2, { message: 'Provider must be at least 2 characters' })
  @MaxLength(255, { message: 'Provider must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  provider: string;

  @ApiProperty({
    description: 'Scholarship type',
    enum: ScholarshipType,
    example: ScholarshipType.FULL,
  })
  @IsEnum(ScholarshipType, { message: 'Type must be a valid scholarship type' })
  @IsNotEmpty({ message: 'Type is required' })
  type: ScholarshipType;

  @ApiProperty({
    description: 'Scholarship description',
    example: 'Full scholarship covering tuition and accommodation',
    maxLength: 2000,
  })
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  description: string;

  @ApiProperty({
    description: 'Eligibility criteria',
    example: 'GPA above 3.5, Egyptian nationality',
    maxLength: 1000,
  })
  @IsString({ message: 'Eligibility must be a string' })
  @IsNotEmpty({ message: 'Eligibility criteria is required' })
  @MaxLength(1000, { message: 'Eligibility must not exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  eligibility: string;

  @ApiProperty({
    description: 'Application deadline',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsDateString({}, { message: 'Deadline must be a valid date' })
  @IsNotEmpty({ message: 'Deadline is required' })
  deadline: string;

  @ApiProperty({
    description: 'Application link',
    example: 'https://scholarships.example.com/apply',
  })
  @IsUrl(
    { protocols: ['http', 'https'] },
    { message: 'Link must be a valid URL' },
  )
  @IsNotEmpty({ message: 'Link is required' })
  @Transform(({ value }) => value?.trim())
  link: string;

  @ApiProperty({
    description: 'What the scholarship covers',
    enum: ScholarshipCoverage,
    isArray: true,
    example: [ScholarshipCoverage.TUITION, ScholarshipCoverage.LIVING_EXPENSES],
  })
  @IsArray({ message: 'Coverage must be an array' })
  @IsEnum(ScholarshipCoverage, {
    each: true,
    message: 'Each coverage item must be valid',
  })
  coverage: ScholarshipCoverage[];

  @ApiPropertyOptional({
    description: 'Target country',
    example: 'Egypt',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Country must be a string' })
  @MaxLength(100, { message: 'Country must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  country?: string;

  @ApiPropertyOptional({
    description: 'Field of study',
    example: 'Engineering',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Field of study must be a string' })
  @MaxLength(255, { message: 'Field of study must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  fieldOfStudy?: string;

  @ApiProperty({
    description: 'University ID that offers this scholarship',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'University ID must be a valid UUID' })
  @IsNotEmpty({ message: 'University ID is required' })
  universityId: string;
}
