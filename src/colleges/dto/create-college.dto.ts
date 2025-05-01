import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsUrl,
} from 'class-validator';

export class CreateCollegeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string; // Add location field

  @IsUrl() // Validate if it's a URL
  @IsOptional()
  website?: string; // Add website field

  @IsUUID()
  @IsNotEmpty()
  universityId: string; // Ensure universityId is provided when creating
}
