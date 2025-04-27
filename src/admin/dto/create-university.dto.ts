import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { UniversityType } from '../../universities/university.entity';

export class CreateUniversityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(UniversityType)
  type: UniversityType;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(1800)
  @Max(new Date().getFullYear())
  establishment: number;

  @IsNumber()
  @Min(1)
  collegesCount: number;

  @IsNumber()
  @Min(1)
  majorsCount: number;

  @IsOptional()
  @IsString()
  image?: string;
}
