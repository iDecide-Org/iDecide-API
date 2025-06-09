import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRepository } from './users/users.repository';
import { UserEnrichmentService } from './user-enrichment.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { User, UserType } from './users/user.entity';
import { Response, Request } from 'express';
import {
  BadRequestException,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let userRepository: jest.Mocked<UserRepository>;
  let userEnrichmentService: jest.Mocked<UserEnrichmentService>;

  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword',
    type: UserType.STUDENT,
    DateOfBirth: new Date('1995-01-01'),
    Government: 'Test Government',
    District: 'Test District',
    city: 'Test City',
    phoneNumber: '+1234567890',
    gender: 'male',
    preferredCommunication: 'email',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    resetPasswordToken: null,
    resetPasswordExpires: null,
    ProfilePicid: null,
    student: null,
    advisor: null,
    admin: null,
    sentMessages: [],
    receivedMessages: [],
    favoriteUniversityLinks: [],
    favoriteScholarshipLinks: [],
    createdUniversity: null,
    createdScholarships: [],
  } as User;

  // Fix: Properly type the mock request
  const mockRequest = {
    user: mockUser,
    cookies: {},
    signedCookies: {},
    get: jest.fn(),
    header: jest.fn(),
    accepts: jest.fn(),
    acceptsCharsets: jest.fn(),
    acceptsEncodings: jest.fn(),
    acceptsLanguages: jest.fn(),
    is: jest.fn(),
    param: jest.fn(),
    range: jest.fn(),
    // Add other required Request properties as needed
  } as unknown as Request;

  const mockResponse = {
    clearCookie: jest.fn(),
    cookie: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as Response;

  beforeEach(async () => {
    const mockAuthService = {
      Signup: jest.fn(),
      Signin: jest.fn(),
      deleteUser: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
    };

    const mockUserRepository = {
      updateChatbotStatus: jest.fn(),
      updateUserProfile: jest.fn(),
      findById: jest.fn(),
    };

    const mockUserEnrichmentService = {
      enrichUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: UserEnrichmentService,
          useValue: mockUserEnrichmentService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    userRepository = module.get(UserRepository);
    userEnrichmentService = module.get(UserEnrichmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateChatbotStatus', () => {
    it('should update chatbot status successfully', async () => {
      // Arrange
      const body = { status: true };
      userRepository.updateChatbotStatus.mockResolvedValue(undefined);

      // Act
      const result = await controller.updateChatbotStatus(body, mockRequest);

      // Assert
      expect(userRepository.updateChatbotStatus).toHaveBeenCalledWith(
        'user-1',
        true,
      );
      expect(result).toEqual({ message: 'Success' });
    });

    it('should handle repository errors', async () => {
      // Arrange
      const body = { status: false };
      userRepository.updateChatbotStatus.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(
        controller.updateChatbotStatus(body, mockRequest),
      ).rejects.toThrow('Database error');
    });
  });

  describe('Signup', () => {
    it('should create user successfully', async () => {
      // Arrange
      const signupDto: SignupDto = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        type: UserType.STUDENT,
      };

      const mockToken = 'jwt-token';
      authService.Signup.mockResolvedValue({ token: mockToken });

      // Act
      const result = await controller.Signup(signupDto, mockResponse);

      // Assert
      expect(authService.Signup).toHaveBeenCalledWith(signupDto, mockResponse);
      expect(result).toEqual({ massage: 'Success', token: mockToken });
    });

    it('should handle signup errors', async () => {
      // Arrange
      const signupDto: SignupDto = {
        name: 'New User',
        email: 'duplicate@example.com',
        password: 'password123',
        type: UserType.STUDENT,
      };

      authService.Signup.mockRejectedValue(
        new BadRequestException('Email already exists'),
      );

      // Act & Assert
      await expect(controller.Signup(signupDto, mockResponse)).rejects.toThrow(
        'Email already exists',
      );
    });
  });

  describe('Signin', () => {
    it('should sign in user successfully', async () => {
      // Arrange
      const signinDto: SigninDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResult = { message: 'Success' };
      authService.Signin.mockResolvedValue(mockResult);

      // Act
      const result = await controller.Signin(signinDto, mockResponse);

      // Assert
      expect(authService.Signin).toHaveBeenCalledWith(signinDto, mockResponse);
      expect(result).toEqual(mockResult);
    });

    it('should handle invalid credentials', async () => {
      // Arrange
      const signinDto: SigninDto = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };

      authService.Signin.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      // Act & Assert
      await expect(controller.Signin(signinDto, mockResponse)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // Arrange
      const userId = 'user-1';
      // Fix: deleteUser should return void, not an object
      authService.deleteUser.mockResolvedValue(undefined);

      // Act
      const result = await controller.deleteUser(userId);

      // Assert
      expect(authService.deleteUser).toHaveBeenCalledWith(userId);
      // Fix: The controller returns what the service returns (void/undefined)
      expect(result).toBeUndefined();
    });

    it('should handle user not found error', async () => {
      // Arrange
      const userId = 'non-existent';
      authService.deleteUser.mockRejectedValue(
        new BadRequestException('User not found'),
      );

      // Act & Assert
      await expect(controller.deleteUser(userId)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('getUser', () => {
    it('should return enriched user data', async () => {
      // Arrange
      // Fix: Create a properly typed enriched user that matches the expected return type
      const enrichedUser = {
        id: 'user-1',
        certificateType: 'HIGH_SCHOOL', // Assuming this is from CertificateType enum
        CertificatePic: 'certificate.jpg',
        StudyDivision: 'Science',
        totalScore: 95,
        nationality: 'Egyptian',
        isStudentCertified: true,
        isAlumni: false,
        isAlumniCertified: false,
        chatbotCompleted: true,
        user: mockUser,
      };

      userEnrichmentService.enrichUser.mockResolvedValue(enrichedUser);

      // Act
      const result = await controller.getUser(mockRequest);

      // Assert
      expect(userEnrichmentService.enrichUser).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(enrichedUser);
    });

    it('should handle enrichment errors', async () => {
      // Arrange
      userEnrichmentService.enrichUser.mockRejectedValue(
        new UnauthorizedException('User not found'),
      );

      // Act & Assert
      await expect(controller.getUser(mockRequest)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      // Act
      const result = await controller.getProfile(mockRequest);

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should handle case when user is null', async () => {
      // Arrange
      const mockRequestWithoutUser = {
        ...mockRequest,
        user: null,
      } as unknown as Request;

      // Act & Assert
      await expect(
        controller.getProfile(mockRequestWithoutUser),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      // Arrange
      const updateProfileDto: UpdateProfileDto = {
        name: 'Updated Name',
        phoneNumber: '+9876543210',
      };

      userRepository.updateUserProfile.mockResolvedValue(undefined);

      // Act
      const result = await controller.updateProfile(
        mockRequest,
        updateProfileDto,
      );

      // Assert
      expect(userRepository.updateUserProfile).toHaveBeenCalledWith(
        'user-1',
        updateProfileDto,
      );
      expect(result).toEqual({ message: 'Profile updated successfully' });
    });

    it('should handle profile update errors', async () => {
      // Arrange
      const updateProfileDto: UpdateProfileDto = {
        email: 'duplicate@example.com',
      };

      userRepository.updateUserProfile.mockRejectedValue(
        new BadRequestException('Email already exists'),
      );

      // Act & Assert
      await expect(
        controller.updateProfile(mockRequest, updateProfileDto),
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('logout', () => {
    it('should clear JWT cookie and return success message', async () => {
      // Act
      const result = await controller.logout(mockResponse);

      // Assert
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('jwt');
      expect(result).toEqual({ message: 'Success' });
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email successfully', async () => {
      // Arrange
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'test@example.com',
      };

      // Fix: Mock to return void instead of undefined
      authService.forgotPassword.mockResolvedValue(undefined);

      // Act
      const result = await controller.forgotPassword(forgotPasswordDto);

      // Assert
      expect(authService.forgotPassword).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(result).toEqual({
        message:
          'If an account with that email exists, a password reset link has been sent.',
      });
    });

    it('should return generic message even when service throws error', async () => {
      // Arrange
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'nonexistent@example.com',
      };

      authService.forgotPassword.mockRejectedValue(new Error('User not found'));

      // Act
      const result = await controller.forgotPassword(forgotPasswordDto);

      // Assert
      expect(result).toEqual({
        message:
          'If an account with that email exists, a password reset link has been sent.',
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      // Arrange
      const token = 'valid-reset-token';
      const resetPasswordDto: ResetPasswordDto = {
        password: 'newPassword123',
      };

      authService.resetPassword.mockResolvedValue(undefined);

      // Act
      const result = await controller.resetPassword(token, resetPasswordDto);

      // Assert
      expect(authService.resetPassword).toHaveBeenCalledWith(
        token,
        'newPassword123',
      );
      expect(result).toEqual({ message: 'Password reset successfully.' });
    });

    it('should handle invalid token error', async () => {
      // Arrange
      const token = 'invalid-token';
      const resetPasswordDto: ResetPasswordDto = {
        password: 'newPassword123',
      };

      authService.resetPassword.mockRejectedValue(
        new BadRequestException('Invalid or expired token'),
      );

      // Act & Assert
      await expect(
        controller.resetPassword(token, resetPasswordDto),
      ).rejects.toThrow('Invalid or expired token');
    });

    it('should handle unknown errors', async () => {
      // Arrange
      const token = 'valid-token';
      const resetPasswordDto: ResetPasswordDto = {
        password: 'newPassword123',
      };

      authService.resetPassword.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(
        controller.resetPassword(token, resetPasswordDto),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('getNameOfUser', () => {
    it('should return user name successfully', async () => {
      // Arrange
      const userId = 'user-1';
      userRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await controller.getNameOfUser(userId);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ name: 'Test User' });
    });

    it('should handle user not found', async () => {
      // Arrange
      const userId = 'non-existent';
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.getNameOfUser(userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
