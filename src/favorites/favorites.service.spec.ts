import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesService } from './favorites.service';
import { FavoritesRepository } from './favorite.repository';
import { FavoriteUniversity } from './favorite-university.entity';
import { FavoriteScholarship } from './favorite-scholarship.entity';
import { User, UserType } from '../auth/users/user.entity';
import { University, UniversityType } from '../universities/university.entity';
import {
  Scholarship,
  ScholarshipCoverage,
  ScholarshipType,
} from '../scholarships/scholarship.entity';
import { CertificateType } from '../../src/auth/users/student.entity';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let repository: jest.Mocked<FavoritesRepository>;

  // Fix: Create proper User mock with all required properties
  const mockUser: User = {
    id: 'user-1',
    name: 'John Doe',
    email: 'student@test.com',
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
    student: {
      id: 'student-profile-1',
      user: null,
      CertificatePic: null,
      certificateType: CertificateType.EGYPTIAN_HIGH_SCHOOL,
      StudyDivision: 'Science',
      totalScore: 85.5,
      nationality: 'Egyptian',
      isStudentCertified: true,
      isAlumni: false,
      isAlumniCertified: false,
      chatbotCompleted: false,
    },
    advisor: null,
    admin: null,
    sentMessages: [],
    receivedMessages: [],
    favoriteUniversityLinks: [],
    favoriteScholarshipLinks: [],
    createdUniversity: null,
    createdScholarships: [],
  };

  // Fix: Create proper University mock with all required properties
  const mockUniversity: University = {
    id: 'university-1',
    name: 'Test University',
    location: 'Test Location',
    type: UniversityType.GOVERNMENTAL,
    establishment: 2000,
    description: 'A test university',
    website: 'https://test-university.edu',
    phone: '+1234567890',
    email: 'info@test-university.edu',
    image: 'test-logo.jpg',
    collegesCount: 10,
    majorsCount: 50,
    advisorId: 'advisor-1',
    advisor: null,
    addedBy: null,
    addedById: 'advisor-1',
    colleges: [],
    scholarships: [],
    createdAt: new Date(),
  };

  // Fix: Create proper Scholarship mock with all required properties
  const mockScholarship: Scholarship = {
    id: 'scholarship-1',
    name: 'Merit Scholarship',
    provider: 'Test University',
    type: ScholarshipType.FULL,
    deadline: new Date('2024-12-31'),
    description: 'A scholarship for merit students',
    eligibility: 'GPA > 3.5',
    coverage: [
      ScholarshipCoverage.LIVING_EXPENSES,
      ScholarshipCoverage.TUITION,
    ], // Fix: Add missing coverage property
    universityId: 'university-1',
    university: null,
    advisorId: 'advisor-1',
    advisor: null,
    link: 'https://test-university.edu/scholarships/merit',
    favoritedBy: [], // Fix: Add missing favoritedBy property
    createdAt: new Date(),
  };

  // Fix: Remove createdAt from FavoriteUniversity mock (doesn't exist in entity)
  const mockFavoriteUniversity: FavoriteUniversity = {
    id: 'fav-uni-1',
    userId: 'user-1',
    universityId: 'university-1',
    user: mockUser,
    university: mockUniversity,
  };

  // Fix: Remove createdAt from FavoriteScholarship mock (doesn't exist in entity)
  const mockFavoriteScholarship: FavoriteScholarship = {
    id: 'fav-sch-1',
    userId: 'user-1',
    scholarshipId: 'scholarship-1',
    user: mockUser,
    scholarship: mockScholarship,
  };

  beforeEach(async () => {
    const mockRepository = {
      addFavoriteUniversity: jest.fn(),
      removeFavoriteUniversity: jest.fn(),
      findUserFavoriteUniversities: jest.fn(),
      isUniversityFavorite: jest.fn(),
      addFavoriteScholarship: jest.fn(),
      removeFavoriteScholarship: jest.fn(),
      findUserFavoriteScholarships: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: FavoritesRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    repository = module.get(FavoritesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('University Favorites', () => {
    describe('addUniversityToFavorites', () => {
      it('should add a university to favorites successfully', async () => {
        repository.addFavoriteUniversity.mockResolvedValue(
          mockFavoriteUniversity,
        );

        const result = await service.addUniversityToFavorites(
          'user-1',
          'university-1',
        );

        expect(repository.addFavoriteUniversity).toHaveBeenCalledWith(
          'user-1',
          'university-1',
        );
        expect(result).toEqual(mockFavoriteUniversity);
      });

      it('should handle repository errors gracefully', async () => {
        const error = new Error('Database error');
        repository.addFavoriteUniversity.mockRejectedValue(error);

        await expect(
          service.addUniversityToFavorites('user-1', 'university-1'),
        ).rejects.toThrow('Database error');

        expect(repository.addFavoriteUniversity).toHaveBeenCalledWith(
          'user-1',
          'university-1',
        );
      });
    });

    describe('removeUniversityFromFavorites', () => {
      it('should remove a university from favorites successfully', async () => {
        repository.removeFavoriteUniversity.mockResolvedValue(undefined);

        await service.removeUniversityFromFavorites('user-1', 'university-1');

        expect(repository.removeFavoriteUniversity).toHaveBeenCalledWith(
          'user-1',
          'university-1',
        );
      });

      it('should handle repository errors gracefully', async () => {
        const error = new Error('Database error');
        repository.removeFavoriteUniversity.mockRejectedValue(error);

        await expect(
          service.removeUniversityFromFavorites('user-1', 'university-1'),
        ).rejects.toThrow('Database error');

        expect(repository.removeFavoriteUniversity).toHaveBeenCalledWith(
          'user-1',
          'university-1',
        );
      });
    });

    describe('getUserFavoriteUniversities', () => {
      it('should return user favorite universities', async () => {
        const mockFavorites = [mockFavoriteUniversity];
        repository.findUserFavoriteUniversities.mockResolvedValue(
          mockFavorites,
        );

        const result = await service.getUserFavoriteUniversities('user-1');

        expect(repository.findUserFavoriteUniversities).toHaveBeenCalledWith(
          'user-1',
        );
        expect(result).toEqual(mockFavorites);
      });

      it('should return empty array when user has no favorites', async () => {
        repository.findUserFavoriteUniversities.mockResolvedValue([]);

        const result = await service.getUserFavoriteUniversities('user-1');

        expect(repository.findUserFavoriteUniversities).toHaveBeenCalledWith(
          'user-1',
        );
        expect(result).toEqual([]);
      });

      it('should handle repository errors gracefully', async () => {
        const error = new Error('Database error');
        repository.findUserFavoriteUniversities.mockRejectedValue(error);

        await expect(
          service.getUserFavoriteUniversities('user-1'),
        ).rejects.toThrow('Database error');

        expect(repository.findUserFavoriteUniversities).toHaveBeenCalledWith(
          'user-1',
        );
      });
    });

    describe('isUniversityFavorite', () => {
      it('should return true if university is favorite', async () => {
        repository.isUniversityFavorite.mockResolvedValue(true);

        const result = await service.isUniversityFavorite(
          'user-1',
          'university-1',
        );

        expect(repository.isUniversityFavorite).toHaveBeenCalledWith(
          'user-1',
          'university-1',
        );
        expect(result).toBe(true);
      });

      it('should return false if university is not favorite', async () => {
        repository.isUniversityFavorite.mockResolvedValue(false);

        const result = await service.isUniversityFavorite(
          'user-1',
          'university-1',
        );

        expect(repository.isUniversityFavorite).toHaveBeenCalledWith(
          'user-1',
          'university-1',
        );
        expect(result).toBe(false);
      });

      it('should handle repository errors gracefully', async () => {
        const error = new Error('Database error');
        repository.isUniversityFavorite.mockRejectedValue(error);

        await expect(
          service.isUniversityFavorite('user-1', 'university-1'),
        ).rejects.toThrow('Database error');

        expect(repository.isUniversityFavorite).toHaveBeenCalledWith(
          'user-1',
          'university-1',
        );
      });
    });
  });

  describe('Scholarship Favorites', () => {
    describe('addScholarshipToFavorites', () => {
      it('should add a scholarship to favorites successfully', async () => {
        repository.addFavoriteScholarship.mockResolvedValue(
          mockFavoriteScholarship,
        );

        const result = await service.addScholarshipToFavorites(
          'user-1',
          'scholarship-1',
        );

        expect(repository.addFavoriteScholarship).toHaveBeenCalledWith(
          'user-1',
          'scholarship-1',
        );
        expect(result).toEqual(mockFavoriteScholarship);
      });

      it('should handle repository errors gracefully', async () => {
        const error = new Error('Database error');
        repository.addFavoriteScholarship.mockRejectedValue(error);

        await expect(
          service.addScholarshipToFavorites('user-1', 'scholarship-1'),
        ).rejects.toThrow('Database error');

        expect(repository.addFavoriteScholarship).toHaveBeenCalledWith(
          'user-1',
          'scholarship-1',
        );
      });
    });

    describe('removeScholarshipFromFavorites', () => {
      it('should remove a scholarship from favorites successfully', async () => {
        repository.removeFavoriteScholarship.mockResolvedValue(undefined);

        await service.removeScholarshipFromFavorites('user-1', 'scholarship-1');

        expect(repository.removeFavoriteScholarship).toHaveBeenCalledWith(
          'user-1',
          'scholarship-1',
        );
      });

      it('should handle repository errors gracefully', async () => {
        const error = new Error('Database error');
        repository.removeFavoriteScholarship.mockRejectedValue(error);

        await expect(
          service.removeScholarshipFromFavorites('user-1', 'scholarship-1'),
        ).rejects.toThrow('Database error');

        expect(repository.removeFavoriteScholarship).toHaveBeenCalledWith(
          'user-1',
          'scholarship-1',
        );
      });
    });

    describe('getUserFavoriteScholarships', () => {
      it('should return user favorite scholarships', async () => {
        const mockFavorites = [mockFavoriteScholarship];
        repository.findUserFavoriteScholarships.mockResolvedValue(
          mockFavorites,
        );

        const result = await service.getUserFavoriteScholarships('user-1');

        expect(repository.findUserFavoriteScholarships).toHaveBeenCalledWith(
          'user-1',
        );
        expect(result).toEqual(mockFavorites);
      });

      it('should return empty array when user has no favorite scholarships', async () => {
        repository.findUserFavoriteScholarships.mockResolvedValue([]);

        const result = await service.getUserFavoriteScholarships('user-1');

        expect(repository.findUserFavoriteScholarships).toHaveBeenCalledWith(
          'user-1',
        );
        expect(result).toEqual([]);
      });

      it('should handle repository errors gracefully', async () => {
        const error = new Error('Database error');
        repository.findUserFavoriteScholarships.mockRejectedValue(error);

        await expect(
          service.getUserFavoriteScholarships('user-1'),
        ).rejects.toThrow('Database error');

        expect(repository.findUserFavoriteScholarships).toHaveBeenCalledWith(
          'user-1',
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should propagate repository errors for university operations', async () => {
      const dbError = new Error('Connection timeout');
      repository.addFavoriteUniversity.mockRejectedValue(dbError);

      await expect(
        service.addUniversityToFavorites('user-1', 'university-1'),
      ).rejects.toThrow('Connection timeout');
    });

    it('should propagate repository errors for scholarship operations', async () => {
      const dbError = new Error('Connection timeout');
      repository.addFavoriteScholarship.mockRejectedValue(dbError);

      await expect(
        service.addScholarshipToFavorites('user-1', 'scholarship-1'),
      ).rejects.toThrow('Connection timeout');
    });
  });
});
