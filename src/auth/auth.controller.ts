import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put, // Import Put
  Req,
  Res,
  UnauthorizedException,
  ValidationPipe, // Import ValidationPipe
  Logger, // Import Logger
  HttpException, // Import HttpException
  BadRequestException, // Import BadRequestException
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { Request, Response } from 'express';
// import { JwtService } from '@nestjs/jwt'; // No longer needed for direct verification here
import { UserRepository } from './users/users.repository'; // Still needed for user operations
import { UpdateProfileDto } from './dto/update-profile.dto'; // Import DTO
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from './users/user.entity';
import { instanceToPlain } from 'class-transformer';
import { UserEnrichmentService } from './user-enrichment.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name); // Add Logger instance

  constructor(
    private readonly authService: AuthService,
    // private jwtService: JwtService, // Remove: AuthGuard handles JWT verification
    private readonly userRepository: UserRepository,
    private userEnrichmentService: UserEnrichmentService,
  ) {}

  @Post('chatbot-status')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async updateChatbotStatus(
    @Body() body: { status: boolean },
    @Req() request: Request,
  ) {
    const user = request.user as User; // User is populated by AuthGuard
    // The AuthGuard should ensure user and user.id exist.
    // A more robust check could be done in a custom decorator or a more specific guard if needed.
    await this.userRepository.updateChatbotStatus(user.id, body.status);
    return {
      message: 'Success',
    };
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async Signup(
    @Body() signupDto: SignupDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { token } = await this.authService.Signup(signupDto, response);
    return { massage: 'Success', token };
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async Signin(
    @Body() signinDto: SigninDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.Signin(signinDto, response);
  }
  @Delete('delete/:id')
  async deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }
  @Get('user')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async getUser(@Req() request: Request) {
    const user = request.user as User; // User is populated by AuthGuard
    return this.userEnrichmentService.enrichUser(user);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async getProfile(@Req() request: Request) {
    const user = request.user as User; // User is populated by AuthGuard
    // Fetch the full profile using the ID from the authenticated user

    if (!user) {
      // This scenario (authenticated user not in DB) should be rare if JWTs are managed correctly.
      throw new UnauthorizedException('User profile not found.');
    }
    return user;
  }

  @Put('profile') // Changed from Post to Put for updating existing resource
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Req() request: Request,
    @Body(new ValidationPipe()) updateProfileDto: UpdateProfileDto,
  ) {
    const user = request.user as User; // User is populated by AuthGuard
    // Corrected to call userRepository directly if updateUserProfile is there
    await this.userRepository.updateUserProfile(user.id, updateProfileDto);
    return {
      message: 'Profile updated successfully',
    };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('jwt');
    return {
      message: 'Success',
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body(new ValidationPipe()) forgotPasswordDto: ForgotPasswordDto,
  ) {
    try {
      await this.authService.forgotPassword(forgotPasswordDto.email);
      // Always return a generic success message to avoid revealing if an email exists
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    } catch (error) {
      this.logger.error(`Forgot password error: ${error.message}`, error.stack);
      // Avoid leaking information about email existence in errors too
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }
  }

  @Post('reset-password/:token')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('token') token: string,
    @Body(new ValidationPipe()) resetPasswordDto: ResetPasswordDto,
  ) {
    try {
      await this.authService.resetPassword(token, resetPasswordDto.password);
      return { message: 'Password reset successfully.' };
    } catch (error) {
      this.logger.error(`Reset password error: ${error.message}`, error.stack);
      // Handle specific errors thrown by the service (e.g., invalid/expired token)
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error; // Re-throw known exceptions
      }
      // Generic error for other cases
      throw new HttpException(
        'Failed to reset password.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Get('user/:id')
  @HttpCode(HttpStatus.OK)
  async getNameOfUser(@Param('id') id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const name = user.name;
    return { name };
  }
}
