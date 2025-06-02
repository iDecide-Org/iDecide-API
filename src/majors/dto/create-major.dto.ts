import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMajorDto {
  @ApiProperty({
    description: 'Name of the major',
    example: 'Computer Science',
    minLength: 2,
    maxLength: 200,
  })
  @IsString({ message: 'Major name must be a string' })
  @IsNotEmpty({ message: 'Major name is required' })
  @Length(2, 200, {
    message: 'Major name must be between 2 and 200 characters',
  })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the major',
    example:
      'Computer Science major focuses on programming, algorithms, software development, and computational theory. Students learn various programming languages and develop problem-solving skills.',
    maxLength: 2000,
  })
  @IsString({ message: 'Major description must be a string' })
  @IsOptional()
  @Length(0, 2000, {
    message: 'Major description cannot exceed 2000 characters',
  })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiProperty({
    description: 'UUID of the college this major belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'College ID must be a valid UUID' })
  @IsNotEmpty({ message: 'College ID is required' })
  collegeId: string;
}
