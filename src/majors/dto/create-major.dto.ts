import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateMajorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  collegeId: string; // Ensure collegeId is provided when creating
}
