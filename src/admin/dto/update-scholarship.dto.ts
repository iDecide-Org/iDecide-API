import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ScholarshipType } from '../../scholarships/scholarship.entity';

export class UpdateScholarshipDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  amount?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(ScholarshipType)
  type?: ScholarshipType;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  eligibility?: string[];

  @IsOptional()
  requirements?: string[];

  @IsOptional()
  @IsString()
  applicationLink?: string;

  @IsOptional()
  @IsString()
  views?: string;
}
