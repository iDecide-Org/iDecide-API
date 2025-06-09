import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(),
}));

describe('EmailService', () => {
  let service: EmailService;
  let configService: jest.Mocked<ConfigService>;
  let mockTransporter: {
    verify: jest.MockedFunction<any>;
    sendMail: jest.MockedFunction<any>;
  };

  beforeEach(async () => {
    // Create mock transporter
    mockTransporter = {
      verify: jest.fn(),
      sendMail: jest.fn(),
    };

    // Mock nodemailer.createTransporter
    (nodemailer.createTransport as jest.Mock) = jest
      .fn()
      .mockReturnValue(mockTransporter);

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get(ConfigService);

    // Setup default config values
    configService.get.mockImplementation((key: string) => {
      const config = {
        EMAIL_USER: 'test@gmail.com',
        EMAIL_PASS: 'testpassword',
        EMAIL_FROM: '"iDecide App" <noreply@idecide.com>',
      };
      return config[key];
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should verify transporter on initialization', () => {
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should handle transporter verification success', () => {
      const successCallback = mockTransporter.verify.mock.calls[0][0];
      const logSpy = jest.spyOn(service['logger'], 'log');

      successCallback(null, true);

      expect(logSpy).toHaveBeenCalledWith(
        'Email transporter is ready to send messages',
      );
    });

    it('should handle transporter verification failure', () => {
      const failureCallback = mockTransporter.verify.mock.calls[0][0];
      const errorSpy = jest.spyOn(service['logger'], 'error');
      const testError = new Error('Connection failed');

      failureCallback(testError, false);

      expect(errorSpy).toHaveBeenCalledWith(
        'Email transporter verification failed:',
        testError,
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    const testEmail = 'user@test.com';
    const testResetUrl = 'https://app.idecide.com/reset-password?token=abc123';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should send password reset email successfully', async () => {
      const mockInfo = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);
      const logSpy = jest.spyOn(service['logger'], 'log');

      await service.sendPasswordResetEmail(testEmail, testResetUrl);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"iDecide App" <noreply@idecide.com>',
        to: testEmail,
        subject: 'إعادة تعيين كلمة المرور الخاصة بك في iDecide',
        text: expect.stringContaining(testResetUrl),
        html: expect.stringContaining(testResetUrl),
      });

      expect(logSpy).toHaveBeenCalledWith(
        `Password reset email sent to ${testEmail}: ${mockInfo.messageId}`,
      );
    });

    it('should use fallback email from address when not configured', async () => {
      configService.get.mockImplementation((key: string) => {
        const config = {
          EMAIL_USER: 'test@gmail.com',
          EMAIL_PASS: 'testpassword',
          EMAIL_FROM: undefined, // Not configured
        };
        return config[key];
      });

      const mockInfo = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      await service.sendPasswordResetEmail(testEmail, testResetUrl);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"iDecide App" <noreply@idecide.com>',
        }),
      );
    });

    it('should include correct Arabic content in email', async () => {
      const mockInfo = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      await service.sendPasswordResetEmail(testEmail, testResetUrl);

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];

      expect(emailCall.subject).toBe(
        'إعادة تعيين كلمة المرور الخاصة بك في iDecide',
      );
      expect(emailCall.text).toContain('لقد طلبت إعادة تعيين كلمة المرور');
      expect(emailCall.html).toContain('lang="ar"');
      expect(emailCall.html).toContain('dir="rtl"');
      expect(emailCall.html).toContain(testResetUrl);
    });

    it('should include security warning in email content', async () => {
      const mockInfo = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      await service.sendPasswordResetEmail(testEmail, testResetUrl);

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];

      expect(emailCall.text).toContain(
        'سينتهي صلاحية هذا الرابط خلال ساعة واحدة',
      );
      expect(emailCall.html).toContain('هذا الرابط صالح لمدة ساعة واحدة فقط');
    });

    it('should include current year in footer', async () => {
      const mockInfo = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      await service.sendPasswordResetEmail(testEmail, testResetUrl);

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      const currentYear = new Date().getFullYear();

      expect(emailCall.html).toContain(`${currentYear} iDecide`);
    });

    it('should include recipient email in footer', async () => {
      const mockInfo = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      await service.sendPasswordResetEmail(testEmail, testResetUrl);

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];

      expect(emailCall.html).toContain(
        `تم إرسال هذا البريد الإلكتروني إلى ${testEmail}`,
      );
    });

    it('should throw error when email sending fails', async () => {
      const testError = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValue(testError);
      const errorSpy = jest.spyOn(service['logger'], 'error');

      await expect(
        service.sendPasswordResetEmail(testEmail, testResetUrl),
      ).rejects.toThrow('Could not send password reset email.');

      expect(errorSpy).toHaveBeenCalledWith(
        `Failed to send password reset email to ${testEmail}:`,
        testError,
      );
    });

    it('should handle different email addresses correctly', async () => {
      const mockInfo = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);
      const testEmails = [
        'user@example.com',
        'arabic.user@domain.com',
        'test.email+tag@university.edu',
      ];

      for (const email of testEmails) {
        await service.sendPasswordResetEmail(email, testResetUrl);

        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: email,
          }),
        );
      }

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(testEmails.length);
    });

    it('should handle different reset URLs correctly', async () => {
      const mockInfo = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);
      const testUrls = [
        'https://app.idecide.com/reset?token=abc123',
        'https://staging.idecide.com/reset-password?t=xyz789&exp=3600',
        'http://localhost:3000/reset?token=test123',
      ];

      for (const url of testUrls) {
        await service.sendPasswordResetEmail(testEmail, url);

        const emailCall =
          mockTransporter.sendMail.mock.calls[
            mockTransporter.sendMail.mock.calls.length - 1
          ][0];
        expect(emailCall.text).toContain(url);
        expect(emailCall.html).toContain(url);
      }

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(testUrls.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing configuration gracefully', () => {
      configService.get.mockReturnValue(undefined);

      // This should not throw during service creation
      expect(() => {
        new EmailService(configService);
      }).not.toThrow();
    });

    it('should propagate transporter errors correctly', async () => {
      const networkError = new Error('Network unreachable');
      mockTransporter.sendMail.mockRejectedValue(networkError);

      await expect(
        service.sendPasswordResetEmail('test@test.com', 'http://example.com'),
      ).rejects.toThrow('Could not send password reset email.');
    });
  });
});
