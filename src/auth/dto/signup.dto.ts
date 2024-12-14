import { IsString, IsEmail, IsEnum, MinLength } from 'class-validator';
import { UserType } from '../user.entity';

export class SignupDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsEnum(UserType, { message: 'Type must be either "student" or "advisor"' })
  type?: UserType;
}
