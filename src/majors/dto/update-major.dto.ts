import { IsString, IsOptional } from 'class-validator';

export class UpdateMajorDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  // collegeId typically shouldn't be updated
}
