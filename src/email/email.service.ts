import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Optional: If using NestJS ConfigModule
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer'; // Import Mail type for transporter

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Mail;

  constructor(private readonly configService: ConfigService) {
    const transportOptions = {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: 'jodojodo780@gmail.com', // Replace with your email from config/env
        pass: 'aeby rnzh gvuv tbaj', // Replace with your app password from config/env
      },
    };

    this.transporter = nodemailer.createTransport(transportOptions);

    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Email transporter verification failed:', error);
      } else {
        this.logger.log('Email transporter is ready to send messages');
      }
    });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const fromAddress =
      this.configService.get<string>('EMAIL_FROM') ||
      '"iDecide App" <noreply@idecide.com>'; // Use a more specific fallback
    const appName = 'iDecide';
    const logoUrl = 'YOUR_LOGO_URL'; // e.g., 'https://yourdomain.com/images/logo.png'

    const mailOptions = {
      from: fromAddress,
      to: to,
      subject: `إعادة تعيين كلمة المرور الخاصة بك في ${appName}`, // Arabic Subject
      text: `لقد طلبت إعادة تعيين كلمة المرور. يرجى النقر على الرابط التالي لإعادة تعيين كلمة المرور الخاصة بك: ${resetUrl}\n\nإذا لم تطلب ذلك، فيرجى تجاهل هذا البريد الإلكتروني.\n\nسينتهي صلاحية هذا الرابط خلال ساعة واحدة.`, // Plain text version in Arabic
      html: `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>إعادة تعيين كلمة المرور</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap'); /* Example Arabic Font */

  body {
    font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; /* Use Cairo font */
    margin: 0;
    padding: 0;
    background-color: #f0f4f8; /* Lighter blue background */
    direction: rtl;
    text-align: right;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .email-wrapper {
    padding: 20px;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    padding: 40px;
    border-radius: 12px; /* Softer corners */
    box-shadow: 0 4px 15px rgba(0, 87, 184, 0.1); /* Subtle blue shadow */
    border: 1px solid #e0eaf3; /* Light border */
  }
  .header {
    text-align: center;
    padding-bottom: 25px;
    border-bottom: 1px solid #e0eaf3;
    margin-bottom: 25px;
  }
  .logo {
    max-width: 150px; /* Adjust as needed */
    height: auto;
    margin-bottom: 15px;
  }
  .header h1 {
    color: #0057b8; /* Darker blue */
    margin: 0;
    font-size: 26px;
    font-weight: 700; /* Bolder */
  }
  .content {
    padding: 10px 0;
    color: #334155; /* Darker gray for text */
    line-height: 1.7;
    font-size: 16px;
  }
  .content p {
    margin: 18px 0;
  }
  .button-container {
    text-align: center;
    margin: 35px 0;
  }
  .button {
    background-color: #007bff; /* Standard blue */
    color: #ffffff !important; /* Ensure text is white */
    padding: 14px 30px;
    text-decoration: none !important; /* Remove underline */
    border-radius: 8px;
    font-weight: 700; /* Bolder */
    display: inline-block;
    border: none;
    cursor: pointer;
    transition: background-color 0.3s ease;
    font-size: 16px;
  }
  .button:hover {
    background-color: #0056b3; /* Darker blue on hover */
  }
  .link-container p {
    font-size: 14px;
    color: #64748b; /* Lighter gray */
    word-break: break-all; /* Ensure long links wrap */
  }
  .link-container a {
     color: #007bff;
     text-decoration: none;
  }
   .link-container a:hover {
     text-decoration: underline;
   }
  .footer {
    text-align: center;
    padding-top: 25px;
    border-top: 1px solid #e0eaf3;
    font-size: 13px;
    color: #94a3b8; /* Lightest gray */
    margin-top: 25px;
  }
  .footer p {
    margin: 5px 0;
  }
</style>
</head>
<body>
<div class="email-wrapper">
  <div class="container">
    <div class="header">
      ${logoUrl !== 'YOUR_LOGO_URL' ? `<img src="${logoUrl}" alt="${appName} Logo" class="logo">` : `<h1>${appName}</h1>`}
    </div>
    <div class="content">
      <p>مرحباً،</p>
      <p>لقد تلقينا طلبًا لإعادة تعيين كلمة المرور لحسابك المرتبط بهذا البريد الإلكتروني.</p>
      <p>لإكمال العملية، يرجى النقر على الزر أدناه:</p>
      <div class="button-container">
        <a href="${resetUrl}" target="_blank" class="button">إعادة تعيين كلمة المرور</a>
      </div>
      <div class="link-container">
        <p>إذا كنت تواجه مشكلة في النقر على الزر، يمكنك نسخ الرابط التالي ولصقه مباشرة في شريط عنوان متصفحك:</p>
        <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
      </div>
      <p><strong>هام:</strong> هذا الرابط صالح لمدة ساعة واحدة فقط من وقت إرسال هذا البريد الإلكتروني.</p>
      <p>إذا لم تكن أنت من طلب إعادة تعيين كلمة المرور، فلا داعي لاتخاذ أي إجراء. يمكنك تجاهل هذا البريد الإلكتروني بأمان، ولن يتم تغيير كلمة مرورك.</p>
      <p>شكراً لك,<br>فريق ${appName}</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${appName}. جميع الحقوق محفوظة.</p>
      <p>تم إرسال هذا البريد الإلكتروني إلى ${to}</p>
    </div>
  </div>
  </div>
</body>
</html>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${to}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}:`, error);
      throw new Error(`Could not send password reset email.`);
    }
  }

  // Add other email sending methods here if needed (e.g., confirmation email)
}
