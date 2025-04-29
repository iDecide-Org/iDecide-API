import { IsString, IsNotEmpty, IsEmail, IsEnum } from 'class-validator';
import { UserType } from '../../auth/users/user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(UserType)
  type: UserType;
}
