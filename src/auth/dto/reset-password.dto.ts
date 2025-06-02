import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '../../common/decorators/validation.decorators';

export class ResetPasswordDto {
  @ApiProperty({
    description:
      'New strong password with at least 8 characters including uppercase, lowercase, number, and special character',
    example: 'MyNewSecurePass123!',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @IsStrongPassword({
    message:
      'Password must be strong (8+ chars, uppercase, lowercase, number, special char)',
  })
  password: string;
}
