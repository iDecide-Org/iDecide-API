import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Optional: If using NestJS ConfigModule
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer'; // Import Mail type for transporter

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Mail;

  constructor(private readonly configService: ConfigService) {
    console.log(this.configService.get<string>('EMAIL_HOST'));

    // Inject ConfigService if used
    // Configure the SMTP transporter
    // Ensure you have these environment variables set:
    // EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE (true/false), EMAIL_USER, EMAIL_PASS, EMAIL_FROM
    const transportOptions = {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: 'jodojodo780@gmail.com',
        pass: 'aeby rnzh gvuv tbaj',
      },
      // Optional: Add TLS options if needed (e.g., for self-signed certs)
      // tls: {
      //   rejectUnauthorized: false // Use with caution
      // }
    };

    this.transporter = nodemailer.createTransport(transportOptions);

    // Optional: Verify connection configuration during startup
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Email transporter verification failed:', error);
      } else {
        this.logger.log('Email transporter is ready to send messages');
      }
    });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const fromAddress = this.configService.get<string>('EMAIL_FROM'); // e.g., '"No Reply - iDecide" <noreply@example.com>'

    const mailOptions = {
      from: fromAddress,
      to: to,
      subject: 'Reset Your iDecide Password',
      text: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}\n\nIf you did not request this, please ignore this email.\n\nThis link will expire in 1 hour.`,
      html: `<p>You requested a password reset. Please click the following link to reset your password:</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>
             <p>If you did not request this, please ignore this email.</p>
             <p>This link will expire in 1 hour.</p>`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${to}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}:`, error);
      // Depending on requirements, you might want to re-throw or handle differently
      throw new Error(`Could not send password reset email.`);
    }
  }

  // Add other email sending methods here if needed (e.g., confirmation email)
}
