import { Test, TestingModule } from '@nestjs/testing';
import { ScholarshipsController } from './scholarship.controller';
import { ScholarshipsService } from './scholarship.service';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto';
import { User, UserType } from '../auth/users/user.entity';
import { Request } from 'express';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import {
  Scholarship,
  ScholarshipType,
  ScholarshipCoverage,
} from './scholarship.entity';

describe('ScholarshipsController', () => {
  let controller: ScholarshipsController;
  let scholarshipsService: jest.Mocked<ScholarshipsService>;

  const mockAdvisorUser: User = {
    id: 'advisor-1',
    name: 'Test Advisor',
    email: 'advisor@example.com',
    type: UserType.ADVISOR,
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

  const mockStudentUser: User = {
    id: 'student-1',
    name: 'Test Student',
    email: 'student@example.com',
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

  // Fix: Create proper mock Request objects
  const mockAdvisorRequest = {
    user: mockAdvisorUser,
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

  const mockStudentRequest = {
    user: mockStudentUser,
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

  // Fix: Create a complete Scholarship mock object with Date instead of string
  const mockScholarship: Scholarship = {
    id: 'scholarship-1',
    name: 'Test Scholarship',
    provider: 'Test Provider',
    type: ScholarshipType.FULL,
    description: 'Test Description',
    eligibility: 'Test requirements',
    deadline: new Date('2024-12-31T23:59:59.000Z'), // Fix: Use Date object instead of string
    link: 'http://example.com',
    coverage: [ScholarshipCoverage.TUITION],
    country: 'Egypt',
    fieldOfStudy: 'Engineering',
    universityId: 'university-1',
    advisorId: 'advisor-1',
    university: null,
    advisor: mockAdvisorUser,
    favoritedBy: [],
    createdAt: new Date('2023-01-01'),
  };

  beforeEach(async () => {
    const mockScholarshipsService = {
      createScholarship: jest.fn(),
      findByAdvisor: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(), // Fix: Use correct method name
      updateScholarship: jest.fn(),
      deleteScholarship: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScholarshipsController],
      providers: [
        {
          provide: ScholarshipsService,
          useValue: mockScholarshipsService,
        },
      ],
    }).compile();

    controller = module.get<ScholarshipsController>(ScholarshipsController);
    scholarshipsService = module.get(ScholarshipsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addScholarship', () => {
    it('should create scholarship successfully', async () => {
      // Arrange
      const createScholarshipDto: CreateScholarshipDto = {
        name: 'New Scholarship',
        provider: 'Test Provider',
        type: ScholarshipType.FULL,
        description: 'Test Description',
        eligibility: 'Test requirements',
        deadline: '2024-12-31T23:59:59.000Z', // Keep as string for DTO (this gets converted by the service)
        link: 'http://example.com',
        coverage: [ScholarshipCoverage.TUITION],
        country: 'Egypt',
        fieldOfStudy: 'Engineering',
        universityId: 'university-1',
      };

      scholarshipsService.createScholarship.mockResolvedValue(mockScholarship);

      // Act
      const result = await controller.addScholarship(
        createScholarshipDto,
        mockAdvisorRequest,
      );

      // Assert
      expect(scholarshipsService.createScholarship).toHaveBeenCalledWith(
        createScholarshipDto,
        mockAdvisorUser,
      );
      expect(result).toEqual(mockScholarship);
    });

    it('should handle service errors during creation', async () => {
      // Arrange
      const createScholarshipDto: CreateScholarshipDto = {
        name: 'Invalid Scholarship',
        provider: 'Test Provider',
        type: ScholarshipType.FULL,
        description: 'Test Description',
        eligibility: 'Test requirements',
        deadline: '2024-12-31T23:59:59.000Z', // Keep as string for DTO
        link: 'http://example.com',
        coverage: [ScholarshipCoverage.TUITION],
        country: 'Egypt',
        fieldOfStudy: 'Engineering',
        universityId: 'non-existent-university',
      };

      scholarshipsService.createScholarship.mockRejectedValue(
        new BadRequestException('University not found'),
      );

      // Act & Assert
      await expect(
        controller.addScholarship(createScholarshipDto, mockAdvisorRequest),
      ).rejects.toThrow('University not found');
    });

    it('should allow student to create scholarship', async () => {
      // Arrange
      const createScholarshipDto: CreateScholarshipDto = {
        name: 'Student Scholarship',
        provider: 'Test Provider',
        type: ScholarshipType.PARTIAL,
        description: 'Test Description',
        eligibility: 'Test requirements',
        deadline: '2024-12-31T23:59:59.000Z', // Keep as string for DTO
        link: 'http://example.com',
        coverage: [ScholarshipCoverage.TUITION],
        country: 'Egypt',
        fieldOfStudy: 'Engineering',
        universityId: 'university-1',
      };

      scholarshipsService.createScholarship.mockResolvedValue(mockScholarship);

      // Act
      const result = await controller.addScholarship(
        createScholarshipDto,
        mockStudentRequest,
      );

      // Assert
      expect(scholarshipsService.createScholarship).toHaveBeenCalledWith(
        createScholarshipDto,
        mockStudentUser,
      );
      expect(result).toEqual(mockScholarship);
    });
  });

  describe('getAdvisorScholarships', () => {
    it('should return scholarships for advisor', async () => {
      // Arrange
      const scholarships = [mockScholarship];
      scholarshipsService.findByAdvisor.mockResolvedValue(scholarships);

      // Act
      const result =
        await controller.getAdvisorScholarships(mockAdvisorRequest);

      // Assert
      expect(scholarshipsService.findByAdvisor).toHaveBeenCalledWith(
        'advisor-1',
      );
      expect(result).toEqual(scholarships);
    });

    it('should throw UnauthorizedException for non-advisor users', async () => {
      // Act & Assert
      await expect(
        controller.getAdvisorScholarships(mockStudentRequest),
      ).rejects.toThrow(
        new UnauthorizedException('Only advisors can access this resource.'),
      );
      expect(scholarshipsService.findByAdvisor).not.toHaveBeenCalled();
    });

    it('should handle empty results for advisor', async () => {
      // Arrange
      scholarshipsService.findByAdvisor.mockResolvedValue([]);

      // Act
      const result =
        await controller.getAdvisorScholarships(mockAdvisorRequest);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      // Arrange
      scholarshipsService.findByAdvisor.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(
        controller.getAdvisorScholarships(mockAdvisorRequest),
      ).rejects.toThrow('Database error');
    });
  });

  describe('getAllScholarships', () => {
    it('should return all scholarships', async () => {
      // Arrange
      const scholarships = [mockScholarship];
      scholarshipsService.findAll.mockResolvedValue(scholarships);

      // Act
      const result = await controller.getAllScholarships();

      // Assert
      expect(scholarshipsService.findAll).toHaveBeenCalledWith();
      expect(result).toEqual(scholarships);
    });

    it('should handle empty results', async () => {
      // Arrange
      scholarshipsService.findAll.mockResolvedValue([]);

      // Act
      const result = await controller.getAllScholarships();

      // Assert
      expect(scholarshipsService.findAll).toHaveBeenCalledWith();
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      // Arrange
      scholarshipsService.findAll.mockRejectedValue(new Error('Service error'));

      // Act & Assert
      await expect(controller.getAllScholarships()).rejects.toThrow(
        'Service error',
      );
    });
  });

  describe('getScholarship', () => {
    // Fix: Use correct method name
    it('should return scholarship by ID', async () => {
      // Arrange
      const scholarshipId = 'scholarship-1';
      scholarshipsService.findById.mockResolvedValue(mockScholarship); // Fix: Use correct method

      // Act
      const result = await controller.getScholarship(scholarshipId); // Fix: Use correct method name

      // Assert
      expect(scholarshipsService.findById).toHaveBeenCalledWith(scholarshipId); // Fix: Use correct method
      expect(result).toEqual(mockScholarship);
    });

    it('should handle scholarship not found', async () => {
      // Arrange
      const scholarshipId = 'non-existent';
      scholarshipsService.findById.mockResolvedValue(null); // Fix: Use correct method

      // Act
      const result = await controller.getScholarship(scholarshipId); // Fix: Use correct method name

      // Assert
      expect(result).toBeNull();
    });

    it('should handle service errors', async () => {
      // Arrange
      const scholarshipId = 'scholarship-1';
      scholarshipsService.findById.mockRejectedValue(
        // Fix: Use correct method
        new Error('Database error'),
      );

      // Act & Assert
      await expect(
        controller.getScholarship(scholarshipId), // Fix: Use correct method name
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateScholarship', () => {
    it('should update scholarship successfully', async () => {
      // Arrange
      const scholarshipId = 'scholarship-1';
      const updateScholarshipDto: UpdateScholarshipDto = {
        name: 'Updated Scholarship',
        // Fix: Remove amount as it doesn't exist in UpdateScholarshipDto
      };

      // Fix: Create updatedScholarship with proper Date type for deadline
      const updatedScholarship: Scholarship = {
        ...mockScholarship,
        name: updateScholarshipDto.name!, // Use the updated name
        university: null,
        advisor: mockAdvisorUser,
        favoritedBy: [],
      };
      scholarshipsService.updateScholarship.mockResolvedValue(
        updatedScholarship,
      );

      // Act
      const result = await controller.updateScholarship(
        scholarshipId,
        updateScholarshipDto,
        mockAdvisorRequest,
      );

      // Assert
      expect(scholarshipsService.updateScholarship).toHaveBeenCalledWith(
        scholarshipId,
        updateScholarshipDto,
        mockAdvisorUser,
      );
      expect(result).toEqual(updatedScholarship);
    });

    it('should handle unauthorized update attempt', async () => {
      // Arrange
      const scholarshipId = 'scholarship-1';
      const updateScholarshipDto: UpdateScholarshipDto = {
        name: 'Unauthorized Update',
      };

      scholarshipsService.updateScholarship.mockRejectedValue(
        new UnauthorizedException('Not authorized to update this scholarship'),
      );

      // Act & Assert
      await expect(
        controller.updateScholarship(
          scholarshipId,
          updateScholarshipDto,
          mockAdvisorRequest,
        ),
      ).rejects.toThrow('Not authorized to update this scholarship');
    });

    it('should handle service errors during update', async () => {
      // Arrange
      const scholarshipId = 'scholarship-1';
      const updateScholarshipDto: UpdateScholarshipDto = {
        name: 'Updated Scholarship',
      };

      scholarshipsService.updateScholarship.mockRejectedValue(
        new Error('Update failed'),
      );

      // Act & Assert
      await expect(
        controller.updateScholarship(
          scholarshipId,
          updateScholarshipDto,
          mockAdvisorRequest,
        ),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('removeScholarship', () => {
    // Fix: Use correct method name
    it('should delete scholarship successfully', async () => {
      // Arrange
      const scholarshipId = 'scholarship-1';
      scholarshipsService.deleteScholarship.mockResolvedValue(undefined); // Fix: Return void

      // Act
      const result = await controller.removeScholarship(
        // Fix: Use correct method name
        scholarshipId,
        mockAdvisorRequest,
      );

      // Assert
      expect(scholarshipsService.deleteScholarship).toHaveBeenCalledWith(
        scholarshipId,
        mockAdvisorUser,
      );
      expect(result).toBeUndefined(); // Fix: Expect void
    });

    it('should handle unauthorized deletion attempt', async () => {
      // Arrange
      const scholarshipId = 'scholarship-1';
      scholarshipsService.deleteScholarship.mockRejectedValue(
        new UnauthorizedException('Not authorized to delete this scholarship'),
      );

      // Act & Assert
      await expect(
        controller.removeScholarship(scholarshipId, mockAdvisorRequest), // Fix: Use correct method name
      ).rejects.toThrow('Not authorized to delete this scholarship');
    });

    it('should handle service errors during deletion', async () => {
      // Arrange
      const scholarshipId = 'scholarship-1';
      scholarshipsService.deleteScholarship.mockRejectedValue(
        new Error('Deletion failed'),
      );

      // Act & Assert
      await expect(
        controller.removeScholarship(scholarshipId, mockAdvisorRequest), // Fix: Use correct method name
      ).rejects.toThrow('Deletion failed');
    });

    it('should handle scholarship not found error', async () => {
      // Arrange
      const scholarshipId = 'non-existent';
      scholarshipsService.deleteScholarship.mockRejectedValue(
        new BadRequestException('Scholarship not found'),
      );

      // Act & Assert
      await expect(
        controller.removeScholarship(scholarshipId, mockAdvisorRequest), // Fix: Use correct method name
      ).rejects.toThrow('Scholarship not found');
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
