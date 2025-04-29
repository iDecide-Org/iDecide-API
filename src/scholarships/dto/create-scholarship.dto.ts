import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsUrl,
  IsOptional,
  IsArray,
  IsUUID, // Import IsUUID
} from 'class-validator';
import { ScholarshipType, ScholarshipCoverage } from '../scholarship.entity';

export class CreateScholarshipDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsEnum(ScholarshipType)
  @IsNotEmpty()
  type: ScholarshipType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  eligibility: string;

  @IsDateString()
  @IsNotEmpty()
  deadline: string; // Receive as string, convert in service/repo

  @IsUrl()
  @IsNotEmpty()
  link: string;

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

  @IsUUID()
  @IsNotEmpty() // Make universityId mandatory
  universityId: string;
}
