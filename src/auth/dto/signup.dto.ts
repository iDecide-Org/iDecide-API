import { IsString, IsEmail, IsEnum, IsNotEmpty, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '../users/user.entity';
import { IsStrongPassword } from '../../common/decorators/validation.decorators';

export class SignupDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'Ahmed Mohamed Ali',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @Length(2, 100, {
    message: 'Name must be between 2 and 100 characters',
  })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'ahmed.mohamed@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description:
      'Strong password with at least 8 characters including uppercase, lowercase, number, and special character',
    example: 'MySecurePass123!',
    minLength: 8,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @IsStrongPassword({
    message:
      'Password must be strong (8+ chars, uppercase, lowercase, number, special char)',
  })
  password: string;

  @ApiPropertyOptional({
    description: 'Type of user account',
    enum: UserType,
    example: UserType.STUDENT,
    default: UserType.STUDENT,
  })
  @IsEnum(UserType, { message: 'Type must be either "student" or "advisor"' })
  type?: UserType = UserType.STUDENT;
}
