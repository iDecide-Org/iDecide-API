import { IsString, IsNotEmpty, IsEnum, IsInt, Min, Max, IsNumberString } from 'class-validator';
import { UniversityType } from '../university.entity';

export class CreateUniversityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsEnum(UniversityType)
  @IsNotEmpty()
  type: UniversityType;

  @IsNumberString() // Use IsNumberString if receiving as string from form-data
  @IsNotEmpty()
  establishment: string; // Receive as string, convert in service

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumberString()
  @IsNotEmpty()
  collegesCount: string; // Receive as string, convert in service

  @IsNumberString()
  @IsNotEmpty()
  majorsCount: string; // Receive as string, convert in service

  // Image will be handled separately via file upload
}
