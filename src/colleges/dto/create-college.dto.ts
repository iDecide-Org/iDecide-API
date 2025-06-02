import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsUrl,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCollegeDto {
  @ApiProperty({
    description: 'Name of the college',
    example: 'Faculty of Engineering',
    minLength: 2,
    maxLength: 200,
  })
  @IsString({ message: 'College name must be a string' })
  @IsNotEmpty({ message: 'College name is required' })
  @Length(2, 200, {
    message: 'College name must be between 2 and 200 characters',
  })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the college',
    example:
      'The Faculty of Engineering offers comprehensive programs in various engineering disciplines including Computer Science, Electrical, and Mechanical Engineering.',
    maxLength: 2000,
  })
  @IsString({ message: 'College description must be a string' })
  @IsOptional()
  @Length(0, 2000, {
    message: 'College description cannot exceed 2000 characters',
  })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiPropertyOptional({
    description: 'Physical location or address of the college',
    example: 'Main Campus, Building A, Cairo University',
    maxLength: 300,
  })
  @IsString({ message: 'College location must be a string' })
  @IsOptional()
  @Length(0, 300, {
    message: 'College location cannot exceed 300 characters',
  })
  @Transform(({ value }) => value?.trim())
  location?: string;

  @ApiPropertyOptional({
    description: 'Official website URL of the college',
    example: 'https://engineering.cu.edu.eg',
  })
  @IsUrl(
    { require_protocol: true },
    {
      message: 'College website must be a valid URL with protocol (http/https)',
    },
  )
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  website?: string;

  @ApiProperty({
    description: 'UUID of the university this college belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'University ID must be a valid UUID' })
  @IsNotEmpty({ message: 'University ID is required' })
  universityId: string;
}
