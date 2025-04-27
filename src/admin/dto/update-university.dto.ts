import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { UniversityType } from '../../universities/university.entity';

export class UpdateUniversityDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(UniversityType)
  type?: UniversityType;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1800)
  @Max(new Date().getFullYear())
  establishment?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  collegesCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  majorsCount?: number;

  @IsOptional()
  @IsString()
  image?: string;
}
