import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ScholarshipType } from '../../scholarships/scholarship.entity';

export class CreateScholarshipDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  organization: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsDateString()
  deadline: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsEnum(ScholarshipType)
  type: ScholarshipType;

  @IsString()
  @IsNotEmpty()
  image: string;

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
