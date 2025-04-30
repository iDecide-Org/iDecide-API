import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateCollegeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  // universityId typically shouldn't be updated, but included if needed
  // @IsUUID()
  // @IsOptional()
  // universityId?: string;
}
