import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { UniversitiesService } from './universities.service';
import { UniversitiesRepository } from './universities.repository';
import { User, UserType } from '../auth/users/user.entity';
import { University, UniversityType } from './university.entity';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';

describe('UniversitiesService', () => {
  let service: UniversitiesService;
  let repository: jest.Mocked<UniversitiesRepository>;

  const mockAdvisor: User = {
    id: 'advisor-id',
    name: 'Test Advisor',
    email: 'advisor@test.com',
    password: 'hashed',
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
    advisor: {
      id: 'advisor-profile-id',
      user: null,
      communationEmail: 'advisor@test.com',
      communicationNumber: '+1234567890',
      identificationPic: 'id-pic.jpg',
      isIdentified: true,
    },
    admin: null,
    sentMessages: [],
    receivedMessages: [],
    favoriteUniversityLinks: [],
    favoriteScholarshipLinks: [],
    createdUniversity: null,
    createdScholarships: [],
  };

  // Fix: Create proper Student user with all required Student properties
  const mockStudent: User = {
    id: 'student-id',
    name: 'Test student',
    email: 'student@test.com',
    password: 'hashed',
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
  };

  const mockUniversity: University = {
    id: 'university-id',
    name: 'Test University',
    type: UniversityType.GOVERNMENTAL, // Fix: Use enum value
    location: 'Test Location',
    description: 'Test Description',
    establishment: 2000,
    collegesCount: 5,
    majorsCount: 20,
    website: 'https://test.edu',
    phone: '+1234567890',
    email: 'info@test.edu',
    image: 'test-image.jpg',
    advisorId: 'advisor-id',
    advisor: mockAdvisor,
    addedBy: mockAdvisor,
    addedById: 'advisor-id',
    createdAt: new Date(),
    colleges: [],
    scholarships: [],
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findByAdvisorId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniversitiesService,
        { provide: UniversitiesRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UniversitiesService>(UniversitiesService);
    repository = module.get(UniversitiesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addUniversity', () => {
    const createDto: CreateUniversityDto = {
      name: 'Test University',
      type: UniversityType.GOVERNMENTAL, // Fix: Use enum value
      location: 'Test Location',
      description: 'Test Description',
      establishment: '2000', // Fix: String type as required by DTO
      collegesCount: '5', // Fix: String type as required by DTO
      majorsCount: '20', // Fix: String type as required by DTO
      website: 'https://test.edu',
      phone: '+1234567890',
      email: 'info@test.edu',
    };

    it('should create university successfully', async () => {
      repository.findByAdvisorId.mockResolvedValue(null); // No existing university for advisor
      repository.findByName.mockResolvedValue(null); // Name is unique
      repository.create.mockResolvedValue(mockUniversity);

      const result = await service.addUniversity(
        createDto,
        'test-image.jpg',
        mockAdvisor,
      );

      expect(repository.findByAdvisorId).toHaveBeenCalledWith(mockAdvisor.id);
      expect(repository.findByName).toHaveBeenCalledWith(createDto.name);
      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        establishment: 2000, // Service converts to number
        collegesCount: 5, // Service converts to number
        majorsCount: 20, // Service converts to number
        image: 'test-image.jpg',
        advisor: mockAdvisor,
        advisorId: mockAdvisor.id,
        addedBy: mockAdvisor,
        addedById: mockAdvisor.id,
      });
      expect(result).toEqual(mockUniversity);
    });

    it('should create university without image', async () => {
      repository.findByAdvisorId.mockResolvedValue(null);
      repository.findByName.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockUniversity);

      const result = await service.addUniversity(createDto, null, mockAdvisor);

      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        establishment: 2000,
        collegesCount: 5,
        majorsCount: 20,
        image: null,
        advisor: mockAdvisor,
        advisorId: mockAdvisor.id,
        addedBy: mockAdvisor,
        addedById: mockAdvisor.id,
      });
      expect(result).toEqual(mockUniversity);
    });

    it('should throw UnauthorizedException if user is not an advisor', async () => {
      await expect(
        service.addUniversity(createDto, null, mockStudent),
      ).rejects.toThrow(UnauthorizedException);

      expect(repository.findByAdvisorId).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if advisor already has a university', async () => {
      repository.findByAdvisorId.mockResolvedValue(mockUniversity);

      await expect(
        service.addUniversity(createDto, null, mockAdvisor),
      ).rejects.toThrow(ConflictException);

      expect(repository.findByAdvisorId).toHaveBeenCalledWith(mockAdvisor.id);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if university name already exists', async () => {
      repository.findByAdvisorId.mockResolvedValue(null);
      repository.findByName.mockResolvedValue(mockUniversity);

      await expect(
        service.addUniversity(createDto, null, mockAdvisor),
      ).rejects.toThrow(ConflictException);

      expect(repository.findByName).toHaveBeenCalledWith(createDto.name);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('getAllUniversities', () => {
    it('should return all universities', async () => {
      const universities = [mockUniversity];
      repository.findAll.mockResolvedValue(universities);

      const result = await service.getAllUniversities();

      // Fix: Update expected relations to match actual service implementation
      expect(repository.findAll).toHaveBeenCalledWith([
        'advisor',
        'addedBy',
        'scholarships',
      ]);
      expect(result).toEqual(universities);
    });

    it('should handle empty results', async () => {
      repository.findAll.mockResolvedValue([]);

      const result = await service.getAllUniversities();

      // Fix: Update expected relations to match actual service implementation
      expect(repository.findAll).toHaveBeenCalledWith([
        'advisor',
        'addedBy',
        'scholarships',
      ]);
      expect(result).toEqual([]);
    });
  });

  describe('getUniversityById', () => {
    it('should return university if found', async () => {
      repository.findById.mockResolvedValue(mockUniversity);

      const result = await service.getUniversityById('university-id');

      // Fix: Update expected relations to match actual service implementation
      expect(repository.findById).toHaveBeenCalledWith('university-id', [
        'advisor',
        'addedBy',
        'scholarships',
        'colleges',
      ]);
      expect(result).toEqual(mockUniversity);
    });

    it('should throw NotFoundException if university not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.getUniversityById('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
      // Fix: Update expected relations to match actual service implementation
      expect(repository.findById).toHaveBeenCalledWith('non-existent-id', [
        'advisor',
        'addedBy',
        'scholarships',
        'colleges',
      ]);
    });
  });

  describe('getUniversitiesByAdvisor', () => {
    it('should return university for advisor', async () => {
      repository.findByAdvisorId.mockResolvedValue(mockUniversity);

      const result = await service.getUniversitiesByAdvisor('advisor-id');

      expect(repository.findByAdvisorId).toHaveBeenCalledWith('advisor-id', [
        'colleges',
        'scholarships',
      ]);
      expect(result).toEqual(mockUniversity);
    });

    it('should return null if no university found for advisor', async () => {
      repository.findByAdvisorId.mockResolvedValue(null);

      const result = await service.getUniversitiesByAdvisor('advisor-id');

      expect(repository.findByAdvisorId).toHaveBeenCalledWith('advisor-id', [
        'colleges',
        'scholarships',
      ]);
      expect(result).toBeNull();
    });
  });

  describe('updateUniversity', () => {
    const updateDto: UpdateUniversityDto = {
      name: 'Updated University',
      description: 'Updated Description',
    };

    it('should update university if user is the advisor', async () => {
      // Fix: Properly type the updated university object
      const updatedUniversity: University = {
        ...mockUniversity,
        name: updateDto.name!,
        description: updateDto.description!,
      };
      repository.findById.mockResolvedValue(mockUniversity);
      repository.findByName.mockResolvedValue(null);
      repository.update.mockResolvedValue(updatedUniversity);

      const result = await service.updateUniversity(
        'university-id',
        updateDto,
        'new-image.jpg',
        mockAdvisor,
      );

      expect(repository.findById).toHaveBeenCalledWith('university-id');
      expect(repository.update).toHaveBeenCalledWith('university-id', {
        name: updateDto.name,
        description: updateDto.description,
        image: 'new-image.jpg',
      });
      expect(result).toEqual(updatedUniversity);
    });

    it('should update university without image', async () => {
      // Fix: Properly type the updated university object
      const updatedUniversity: University = {
        ...mockUniversity,
        name: updateDto.name!,
        description: updateDto.description!,
      };
      repository.findById.mockResolvedValue(mockUniversity);
      repository.findByName.mockResolvedValue(null);
      repository.update.mockResolvedValue(updatedUniversity);

      const result = await service.updateUniversity(
        'university-id',
        updateDto,
        undefined,
        mockAdvisor,
      );

      expect(repository.findById).toHaveBeenCalledWith('university-id');
      expect(repository.update).toHaveBeenCalledWith('university-id', {
        name: updateDto.name,
        description: updateDto.description,
      });
      expect(result).toEqual(updatedUniversity);
    });

    it('should throw UnauthorizedException if user is not an advisor', async () => {
      await expect(
        service.updateUniversity('university-id', updateDto, null, mockStudent),
      ).rejects.toThrow(UnauthorizedException);

      expect(repository.findById).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if university not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.updateUniversity(
          'non-existent-id',
          updateDto,
          null,
          mockAdvisor,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(repository.findById).toHaveBeenCalledWith('non-existent-id');
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user is not the university owner', async () => {
      // Fix: Create properly typed University object
      const otherUniversity: University = {
        ...mockUniversity,
        advisorId: 'other-advisor-id',
        type: UniversityType.GOVERNMENTAL, // Ensure correct enum type
      };
      repository.findById.mockResolvedValue(otherUniversity);

      await expect(
        service.updateUniversity('university-id', updateDto, null, mockAdvisor),
      ).rejects.toThrow(UnauthorizedException);
      expect(repository.findById).toHaveBeenCalledWith('university-id');
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if updated name already exists', async () => {
      // Fix: Create properly typed University object
      const otherUniversity: University = {
        ...mockUniversity,
        id: 'other-university-id',
        type: UniversityType.GOVERNMENTAL, // Ensure correct enum type
      };
      repository.findById.mockResolvedValue(mockUniversity);
      repository.findByName.mockResolvedValue(otherUniversity);

      await expect(
        service.updateUniversity('university-id', updateDto, null, mockAdvisor),
      ).rejects.toThrow(ConflictException);
      expect(repository.findByName).toHaveBeenCalledWith(updateDto.name);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('removeUniversity', () => {
    it('should delete university if user is the advisor', async () => {
      repository.findById.mockResolvedValue(mockUniversity);
      repository.delete.mockResolvedValue(undefined);

      await service.removeUniversity('university-id', mockAdvisor);

      expect(repository.findById).toHaveBeenCalledWith('university-id');
      expect(repository.delete).toHaveBeenCalledWith('university-id');
    });

    it('should throw UnauthorizedException if user is not an advisor', async () => {
      await expect(
        service.removeUniversity('university-id', mockStudent),
      ).rejects.toThrow(UnauthorizedException);

      expect(repository.findById).not.toHaveBeenCalled();
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if university not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.removeUniversity('non-existent-id', mockAdvisor),
      ).rejects.toThrow(NotFoundException);
      expect(repository.findById).toHaveBeenCalledWith('non-existent-id');
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user is not the university owner', async () => {
      // Fix: Create properly typed University object
      const otherUniversity: University = {
        ...mockUniversity,
        advisorId: 'other-advisor-id',
        type: UniversityType.GOVERNMENTAL, // Ensure correct enum type
      };
      repository.findById.mockResolvedValue(otherUniversity);

      await expect(
        service.removeUniversity('university-id', mockAdvisor),
      ).rejects.toThrow(UnauthorizedException);
      expect(repository.findById).toHaveBeenCalledWith('university-id');
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
