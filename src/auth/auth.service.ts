import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { UserRepository } from './users/users.repository';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private readonly userRepository: UserRepository,
    @Inject(EmailService) private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async Signup(
    signupDto: SignupDto,
    response: Response,
  ): Promise<{ token: string }> {
    try {
      // Create the user
      const user = await this.userRepository.createUser(signupDto);

      // Generate a JWT token
      const token = this.jwtService.sign({ id: user.id, email: user.email });
      const isProd = process.env.NODE_ENV === 'production';
      response.cookie('jwt', token, {
        httpOnly: true,
        path: '/',
        sameSite: isProd ? 'none' : 'lax', // Use 'lax' in development
        secure: isProd, // Keep secure only in production
      });

      // Return the user and token
      return { token };
    } catch (err) {
      this.logger.error(`Signup Error: ${err.message}`, err.stack);
      throw new HttpException(
        err.message || 'Signup failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async Signin(signinDto: SigninDto, response: Response): Promise<any> {
    try {
      const user = await this.userRepository.validateUser(signinDto);
      const jwt = await this.jwtService.signAsync({ id: user.id });
      const isProd = process.env.NODE_ENV === 'production';
      response.cookie('jwt', jwt, {
        httpOnly: true,
        path: '/',
        sameSite: isProd ? 'none' : 'lax', // Use 'lax' in development
        secure: isProd, // Keep secure only in production
      });

      return { message: 'Success' };
    } catch (err) {
      this.logger.error(`Signin Error: ${err.message}`, err.stack);
      throw new HttpException(
        err.message || 'Signin failed',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async deleteUser(id: string) {
    return this.userRepository.deleteUser(id);
  }

  // --- Forgot Password ---
  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      this.logger.warn(
        `Password reset requested for non-existent email: ${email}`,
      );
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 1);

    try {
      await this.userRepository.updateResetToken(
        user.id,
        hashedResetToken,
        tokenExpiry,
      );

      // Use FRONTEND_URL from environment variables
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      if (!frontendUrl) {
        this.logger.error('FRONTEND_URL environment variable is not set.');
        // Decide how to handle this - maybe throw an internal server error
        // Or skip sending the email if the URL is critical
        return; // Or throw error
      }
      const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
      // this.logger.log(`Password reset URL for ${email}: ${resetUrl}`); // Keep for debugging if needed

      // Send email using EmailService
      await this.emailService.sendPasswordResetEmail(user.email, resetUrl);
    } catch (error) {
      this.logger.error(
        `Failed during forgot password process for user ${user.id}: ${error.message}`,
        error.stack,
      );
      // Avoid exposing internal errors. The controller returns a generic message anyway.
    }
  }

  // --- Reset Password ---
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.userRepository.findByResetToken(hashedToken);

    if (!user) {
      throw new BadRequestException(
        'Password reset token is invalid or has expired.',
      );
    }

    const salt = await bcrypt.genSalt(); // Consider using a consistent salt round (e.g., 10)
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    try {
      await this.userRepository.updatePasswordAndClearResetToken(
        user.id,
        hashedPassword,
      );

      // Optional: Send password change confirmation email
      // await this.emailService.sendPasswordChangeConfirmation(user.email);
    } catch (error) {
      this.logger.error(
        `Failed to reset password for user ${user.id}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to reset password.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
