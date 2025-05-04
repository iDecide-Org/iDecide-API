import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  // You might want to add more complex password validation (e.g., regex for uppercase, numbers, symbols)
  password: string;

  // Optional: Add a confirmPassword field if you want validation directly in the DTO
  // @IsNotEmpty()
  // @IsString()
  // @Validate(MatchPasswordConstraint, ['password']) // Custom validator needed
  // confirmPassword?: string;
}
