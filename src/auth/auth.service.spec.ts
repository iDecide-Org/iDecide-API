import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserRepository } from './users/users.repository';
import { EmailService } from '../email/email.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { User, UserType } from './users/user.entity';
import { HttpException, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let emailService: jest.Mocked<EmailService>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword',
    type: UserType.STUDENT,
    createdAt: new Date(),
    resetPasswordToken: null,
    resetPasswordExpires: null,
    DateOfBirth: null,
    Government: null,
    District: null,
    city: null,
    phoneNumber: null,
    gender: null,
    preferredCommunication: null,
    student: null,
    advisor: null,
    admin: null,
    ProfilePicid: null,
    sentMessages: [],
    receivedMessages: [],
    favoriteUniversityLinks: [],
    favoriteScholarshipLinks: [],
    createdUniversity: null,
    createdScholarships: [],
  };

  const mockResponse = {
    cookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const mockUserRepository = {
      createUser: jest.fn(),
      validateUser: jest.fn(),
      deleteUser: jest.fn(),
      findByEmail: jest.fn(),
      updateResetToken: jest.fn(),
      findByResetToken: jest.fn(),
      updatePasswordAndClearResetToken: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      signAsync: jest.fn(),
    };

    const mockEmailService = {
      sendPasswordResetEmail: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
    jwtService = module.get(JwtService);
    emailService = module.get(EmailService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Signup', () => {
    const signupDto: SignupDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'SecurePass123!',
      type: UserType.STUDENT,
    };

    it('should create a new user successfully', async () => {
      userRepository.createUser.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.Signup(signupDto, mockResponse);

      expect(userRepository.createUser).toHaveBeenCalledWith(signupDto);
      expect(jwtService.sign).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
      });
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'jwt',
        'mock-jwt-token',
        {
          httpOnly: true,
          path: '/',
          sameSite: 'lax',
          secure: false,
        },
      );
      expect(result).toEqual({ token: 'mock-jwt-token' });
    });

    it('should throw HttpException when user creation fails', async () => {
      const error = new Error('Email already exists');
      userRepository.createUser.mockRejectedValue(error);

      await expect(service.Signup(signupDto, mockResponse)).rejects.toThrow(
        HttpException,
      );
      expect(userRepository.createUser).toHaveBeenCalledWith(signupDto);
    });
  });

  describe('Signin', () => {
    const signinDto: SigninDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    it('should sign in user successfully', async () => {
      userRepository.validateUser.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('mock-jwt-token');

      const result = await service.Signin(signinDto, mockResponse);

      expect(userRepository.validateUser).toHaveBeenCalledWith(signinDto);
      expect(jwtService.signAsync).toHaveBeenCalledWith({ id: mockUser.id });
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'jwt',
        'mock-jwt-token',
        {
          httpOnly: true,
          path: '/',
          sameSite: 'lax',
          secure: false,
        },
      );
      expect(result).toEqual({ message: 'Success' });
    });

    it('should throw HttpException when validation fails', async () => {
      const error = new Error('Invalid credentials');
      userRepository.validateUser.mockRejectedValue(error);

      await expect(service.Signin(signinDto, mockResponse)).rejects.toThrow(
        HttpException,
      );
      expect(userRepository.validateUser).toHaveBeenCalledWith(signinDto);
    });
  });

  describe('forgotPassword', () => {
    const email = 'test@example.com';

    it('should handle forgot password for existing user', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      userRepository.updateResetToken.mockResolvedValue(undefined);
      emailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      await service.forgotPassword(email);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(userRepository.updateResetToken).toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should return silently for non-existent user', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await service.forgotPassword(email);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(userRepository.updateResetToken).not.toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const token = 'reset-token';
    const newPassword = 'NewPassword123!';

    beforeEach(() => {
      // Fix: Properly type the bcrypt mocks
      (mockBcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashedNewPassword');
    });

    it('should reset password successfully', async () => {
      userRepository.findByResetToken.mockResolvedValue(mockUser);
      userRepository.updatePasswordAndClearResetToken.mockResolvedValue(
        undefined,
      );

      await service.resetPassword(token, newPassword);

      expect(userRepository.findByResetToken).toHaveBeenCalled();
      expect(mockBcrypt.genSalt).toHaveBeenCalled();
      expect(mockBcrypt.hash).toHaveBeenCalledWith(newPassword, 'salt');
      expect(
        userRepository.updatePasswordAndClearResetToken,
      ).toHaveBeenCalledWith(mockUser.id, 'hashedNewPassword');
    });

    it('should throw BadRequestException for invalid token', async () => {
      userRepository.findByResetToken.mockResolvedValue(null);

      await expect(service.resetPassword(token, newPassword)).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.findByResetToken).toHaveBeenCalled();
      expect(
        userRepository.updatePasswordAndClearResetToken,
      ).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = 'user-id';
      userRepository.deleteUser.mockResolvedValue(undefined);

      await service.deleteUser(userId);

      expect(userRepository.deleteUser).toHaveBeenCalledWith(userId);
    });
  });
});
