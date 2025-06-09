import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { User, UserType } from '../auth/users/user.entity';
import { FavoriteUniversity } from './favorite-university.entity';
import { FavoriteScholarship } from './favorite-scholarship.entity';
import { Request } from 'express';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UniversityType } from '../../src/universities/university.entity';
import {
  ScholarshipCoverage,
  ScholarshipType,
} from '../../src/scholarships/scholarship.entity';

describe('FavoritesController', () => {
  let controller: FavoritesController;
  let favoritesService: jest.Mocked<FavoritesService>;

  const mockUser: User = {
    id: 'user-1',
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

  // Fix: Create proper Request mock with all required properties
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
    url: '/favorites',
    method: 'GET',
    headers: {},
    query: {},
    params: {},
    body: {},
  } as unknown as Request;

  const mockRequestWithoutUser = {
    user: null,
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
    url: '/favorites',
    method: 'GET',
    headers: {},
    query: {},
    params: {},
    body: {},
  } as unknown as Request;

  // Fix: Add missing 'user' property to match FavoriteUniversity interface
  const mockFavoriteUniversity: FavoriteUniversity = {
    id: 'favorite-1',
    userId: 'user-1',
    universityId: 'university-1',
    user: mockUser, // Fix: Add missing user property
    university: {
      id: 'university-1',
      name: 'Test University',
      location: 'Test Location',
      type: UniversityType.GOVERNMENTAL,
      establishment: 2000,
      description: 'Test Description',
      website: 'https://test.edu',
      phone: '+1234567890',
      email: 'info@test.edu',
      image: 'test-logo.jpg',
      collegesCount: 5,
      majorsCount: 20,
      advisorId: 'advisor-1',
      advisor: null,
      addedBy: null,
      addedById: 'advisor-1',
      colleges: [],
      scholarships: [],
      createdAt: new Date(),
    },
  };

  // Fix: Add missing 'user' property to match FavoriteScholarship interface
  const mockFavoriteScholarship: FavoriteScholarship = {
    id: 'favorite-2',
    userId: 'user-1',
    scholarshipId: 'scholarship-1',
    user: mockUser, // Fix: Add missing user property
    scholarship: {
      id: 'scholarship-1',
      name: 'Test Scholarship',
      provider: 'Test Provider',
      type: ScholarshipType.FULL,
      deadline: new Date('2024-12-31'),
      description: 'Test Description',
      eligibility: 'Test Eligibility',
      coverage: [
        ScholarshipCoverage.LIVING_EXPENSES,
        ScholarshipCoverage.TUITION,
      ], // Fix: Add missing coverage property
      universityId: 'university-1',
      university: null,
      advisorId: 'advisor-1',
      link: 'https://test.edu/scholarships/test-scholarship',
      advisor: null,
      favoritedBy: [],
      createdAt: new Date(),
    },
  };

  beforeEach(async () => {
    const mockFavoritesService = {
      getUserFavoriteUniversities: jest.fn(),
      isUniversityFavorite: jest.fn(),
      addUniversityToFavorites: jest.fn(),
      removeUniversityFromFavorites: jest.fn(),
      getUserFavoriteScholarships: jest.fn(),
      // Fix: Remove non-existent method
      addScholarshipToFavorites: jest.fn(),
      removeScholarshipFromFavorites: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [
        {
          provide: FavoritesService,
          useValue: mockFavoritesService,
        },
      ],
    }).compile();

    controller = module.get<FavoritesController>(FavoritesController);
    favoritesService = module.get(FavoritesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFavoriteUniversities', () => {
    it('should return user favorite universities', async () => {
      // Arrange
      const favorites = [mockFavoriteUniversity];
      favoritesService.getUserFavoriteUniversities.mockResolvedValue(favorites);

      // Act
      const result = await controller.getFavoriteUniversities(mockRequest);

      // Assert
      expect(favoritesService.getUserFavoriteUniversities).toHaveBeenCalledWith(
        'user-1',
      );
      expect(result).toEqual(favorites);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      // Act & Assert
      await expect(
        controller.getFavoriteUniversities(mockRequestWithoutUser),
      ).rejects.toThrow(
        new UnauthorizedException('User not authenticated or ID missing.'),
      );
      expect(
        favoritesService.getUserFavoriteUniversities,
      ).not.toHaveBeenCalled();
    });

    it('should handle empty favorites list', async () => {
      // Arrange
      favoritesService.getUserFavoriteUniversities.mockResolvedValue([]);

      // Act
      const result = await controller.getFavoriteUniversities(mockRequest);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      // Arrange
      favoritesService.getUserFavoriteUniversities.mockRejectedValue(
        new Error('Service error'),
      );

      // Act & Assert
      await expect(
        controller.getFavoriteUniversities(mockRequest),
      ).rejects.toThrow('Service error');
    });
  });

  describe('checkFavoriteUniversity', () => {
    it('should return true when university is favorite', async () => {
      // Arrange
      const universityId = 'university-1';
      favoritesService.isUniversityFavorite.mockResolvedValue(true);

      // Act
      const result = await controller.checkFavoriteUniversity(
        universityId,
        mockRequest,
      );

      // Assert
      expect(favoritesService.isUniversityFavorite).toHaveBeenCalledWith(
        'user-1',
        universityId,
      );
      expect(result).toEqual({ isFavorite: true });
    });

    it('should return false when university is not favorite', async () => {
      // Arrange
      const universityId = 'university-2';
      favoritesService.isUniversityFavorite.mockResolvedValue(false);

      // Act
      const result = await controller.checkFavoriteUniversity(
        universityId,
        mockRequest,
      );

      // Assert
      expect(favoritesService.isUniversityFavorite).toHaveBeenCalledWith(
        'user-1',
        universityId,
      );
      expect(result).toEqual({ isFavorite: false });
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      // Arrange
      const universityId = 'university-1';

      // Act & Assert
      await expect(
        controller.checkFavoriteUniversity(
          universityId,
          mockRequestWithoutUser,
        ),
      ).rejects.toThrow(
        new UnauthorizedException('User not authenticated or ID missing.'),
      );
    });
  });

  describe('addFavoriteUniversity', () => {
    it('should add university to favorites successfully', async () => {
      // Arrange
      const universityId = 'university-1';
      favoritesService.addUniversityToFavorites.mockResolvedValue(
        mockFavoriteUniversity,
      );

      // Act
      // Fix: Use correct method name from controller
      const result = await controller.addFavoriteUniversity(
        universityId,
        mockRequest,
      );

      // Assert
      expect(favoritesService.addUniversityToFavorites).toHaveBeenCalledWith(
        'user-1',
        universityId,
      );
      expect(result).toEqual(mockFavoriteUniversity);
    });

    it('should handle duplicate favorite attempts', async () => {
      // Arrange
      const universityId = 'university-1';
      favoritesService.addUniversityToFavorites.mockRejectedValue(
        new BadRequestException('University already in favorites'),
      );

      // Act & Assert
      await expect(
        controller.addFavoriteUniversity(universityId, mockRequest),
      ).rejects.toThrow('University already in favorites');
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      // Arrange
      const universityId = 'university-1';

      // Act & Assert
      await expect(
        controller.addFavoriteUniversity(universityId, mockRequestWithoutUser),
      ).rejects.toThrow(
        new UnauthorizedException('User not authenticated or ID missing.'),
      );
    });
  });

  describe('removeFavoriteUniversity', () => {
    it('should remove university from favorites successfully', async () => {
      // Arrange
      const universityId = 'university-1';
      // Fix: Remove message property as service returns void
      favoritesService.removeUniversityFromFavorites.mockResolvedValue(
        undefined,
      );

      // Act
      // Fix: Use correct method name from controller
      await controller.removeFavoriteUniversity(universityId, mockRequest);

      // Assert
      expect(
        favoritesService.removeUniversityFromFavorites,
      ).toHaveBeenCalledWith('user-1', universityId);
    });

    it('should handle removal when university is not in favorites', async () => {
      // Arrange
      const universityId = 'university-2';
      favoritesService.removeUniversityFromFavorites.mockRejectedValue(
        new BadRequestException('University not found in favorites'),
      );

      // Act & Assert
      await expect(
        controller.removeFavoriteUniversity(universityId, mockRequest),
      ).rejects.toThrow('University not found in favorites');
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      // Arrange
      const universityId = 'university-1';

      // Act & Assert
      await expect(
        controller.removeFavoriteUniversity(
          universityId,
          mockRequestWithoutUser,
        ),
      ).rejects.toThrow(
        new UnauthorizedException('User not authenticated or ID missing.'),
      );
    });
  });

  describe('getFavoriteScholarships', () => {
    it('should return user favorite scholarships', async () => {
      // Arrange
      const favorites = [mockFavoriteScholarship];
      favoritesService.getUserFavoriteScholarships.mockResolvedValue(favorites);

      // Act
      const result = await controller.getFavoriteScholarships(mockRequest);

      // Assert
      expect(favoritesService.getUserFavoriteScholarships).toHaveBeenCalledWith(
        'user-1',
      );
      expect(result).toEqual(favorites);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      // Act & Assert
      await expect(
        controller.getFavoriteScholarships(mockRequestWithoutUser),
      ).rejects.toThrow(
        new UnauthorizedException('User not authenticated or ID missing.'),
      );
    });

    it('should handle empty scholarships list', async () => {
      // Arrange
      favoritesService.getUserFavoriteScholarships.mockResolvedValue([]);

      // Act
      const result = await controller.getFavoriteScholarships(mockRequest);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('addFavoriteScholarship', () => {
    it('should add scholarship to favorites successfully', async () => {
      // Arrange
      const scholarshipId = 'scholarship-1';
      favoritesService.addScholarshipToFavorites.mockResolvedValue(
        mockFavoriteScholarship,
      );

      // Act
      // Fix: Use correct method name from controller
      const result = await controller.addFavoriteScholarship(
        scholarshipId,
        mockRequest,
      );

      // Assert
      expect(favoritesService.addScholarshipToFavorites).toHaveBeenCalledWith(
        'user-1',
        scholarshipId,
      );
      expect(result).toEqual(mockFavoriteScholarship);
    });

    it('should handle duplicate scholarship favorite attempts', async () => {
      // Arrange
      const scholarshipId = 'scholarship-1';
      favoritesService.addScholarshipToFavorites.mockRejectedValue(
        new BadRequestException('Scholarship already in favorites'),
      );

      // Act & Assert
      await expect(
        controller.addFavoriteScholarship(scholarshipId, mockRequest),
      ).rejects.toThrow('Scholarship already in favorites');
    });
  });

  describe('removeFavoriteScholarship', () => {
    it('should remove scholarship from favorites successfully', async () => {
      // Arrange
      const scholarshipId = 'scholarship-1';
      // Fix: Remove message property as service returns void
      favoritesService.removeScholarshipFromFavorites.mockResolvedValue(
        undefined,
      );

      // Act
      // Fix: Use correct method name from controller
      await controller.removeFavoriteScholarship(scholarshipId, mockRequest);

      // Assert
      expect(
        favoritesService.removeScholarshipFromFavorites,
      ).toHaveBeenCalledWith('user-1', scholarshipId);
    });

    it('should handle removal when scholarship is not in favorites', async () => {
      // Arrange
      const scholarshipId = 'scholarship-2';
      favoritesService.removeScholarshipFromFavorites.mockRejectedValue(
        new BadRequestException('Scholarship not found in favorites'),
      );

      // Act & Assert
      await expect(
        controller.removeFavoriteScholarship(scholarshipId, mockRequest),
      ).rejects.toThrow('Scholarship not found in favorites');
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
