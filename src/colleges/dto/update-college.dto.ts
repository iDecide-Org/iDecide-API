import { PartialType } from '@nestjs/mapped-types';
import { CreateCollegeDto } from './create-college.dto';
import { IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';

export class UpdateCollegeDto extends PartialType(CreateCollegeDto) {
  // Inherits optional fields from CreateCollegeDto

  // Add specific validation if needed, though PartialType usually suffices
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  // University ID typically shouldn't be updated this way,
  // but include if your logic allows changing the parent university.
  // @IsUUID()
  // @IsOptional()
  // universityId?: string;
}
