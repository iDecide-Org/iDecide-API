import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { UserType } from '../../auth/users/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsEnum(UserType)
  type?: UserType;
}