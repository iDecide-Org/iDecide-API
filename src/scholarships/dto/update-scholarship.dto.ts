import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUrl,
  IsArray,
} from 'class-validator';
import { ScholarshipType, ScholarshipCoverage } from '../scholarship.entity';

export class UpdateScholarshipDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsEnum(ScholarshipType)
  type?: ScholarshipType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  eligibility?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string; // Keep as string in DTO, convert to Date in service

  @IsOptional()
  @IsUrl()
  link?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(ScholarshipCoverage, { each: true })
  coverage?: ScholarshipCoverage[];

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  fieldOfStudy?: string;
}
