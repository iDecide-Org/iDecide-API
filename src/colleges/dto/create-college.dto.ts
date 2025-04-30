import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateCollegeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  universityId: string; // Ensure universityId is provided when creating
}
