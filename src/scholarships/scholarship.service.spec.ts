import { Test, TestingModule } from '@nestjs/testing';
import { ScholarshipsService } from './scholarship.service';
import { ScholarshipsRepository } from './scholarship.repository';
import { UniversitiesRepository } from '../universities/universities.repository';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto';
import {
  Scholarship,
  ScholarshipType,
  ScholarshipCoverage,
} from './scholarship.entity';
import { User, UserType } from '../auth/users/user.entity';
import { University, UniversityType } from '../universities/university.entity';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';

describe('ScholarshipsService', () => {
  let service: ScholarshipsService;
  let scholarshipsRepository: jest.Mocked<ScholarshipsRepository>;
  let universitiesRepository: jest.Mocked<UniversitiesRepository>;

  // Fix: Mock data with correct User entity properties
  const mockAdvisorUser: User = {
    id: 'advisor-1',
    name: 'John Doe',
    email: 'advisor@test.com',
    password: 'hashedPassword',
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
      id: 'advisor-profile-1',
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

  const mockStudentUser: User = {
    id: 'student-1',
    name: 'Jane Smith',
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

  // Fix: Mock University with all required properties
  const mockUniversity: University = {
    id: 'university-1',
    name: 'Test University',
    location: 'Test Location',
    type: UniversityType.PRIVATE,
    establishment: 1950,
    description: 'A test university',
    website: 'https://test-university.edu',
    phone: '+1234567890',
    email: 'info@test-university.edu',
    image: 'university-image.jpg',
    collegesCount: 10,
    majorsCount: 50,
    advisorId: 'advisor-1',
    advisor: mockAdvisorUser,
    colleges: [],
    scholarships: [],
    createdAt: new Date(),
    addedBy: mockAdvisorUser,
    addedById: 'advisor-1',
  };

  // Fix: Mock Scholarship with correct property names and types
  const mockScholarship: Scholarship = {
    id: 'scholarship-1',
    name: 'Merit Scholarship', // Fix: Use 'name' instead of 'title'
    provider: 'Test Provider',
    type: ScholarshipType.FULL,
    description: 'A scholarship for merit students',
    eligibility: 'GPA > 3.5',
    deadline: new Date('2024-12-31T23:59:59.000Z'), // Fix: Use Date object
    link: 'https://example.com/apply',
    coverage: [ScholarshipCoverage.TUITION],
    country: 'Egypt',
    fieldOfStudy: 'Engineering',
    universityId: 'university-1',
    university: mockUniversity,
    advisorId: 'advisor-1',
    advisor: mockAdvisorUser,
    favoritedBy: [],
    createdAt: new Date(),
  };

  // Fix: Mock DTOs with correct property names
  const mockCreateScholarshipDto: CreateScholarshipDto = {
    name: 'Merit Scholarship', // Fix: Use 'name' instead of 'title'
    provider: 'Test Provider',
    type: ScholarshipType.FULL,
    description: 'A scholarship for merit students',
    eligibility: 'GPA > 3.5',
    deadline: '2024-12-31T23:59:59.000Z', // String in DTO
    link: 'https://example.com/apply',
    coverage: [ScholarshipCoverage.TUITION],
    country: 'Egypt',
    fieldOfStudy: 'Engineering',
    universityId: 'university-1',
  };

  const mockUpdateScholarshipDto: UpdateScholarshipDto = {
    name: 'Updated Merit Scholarship', // Fix: Use 'name' instead of 'title'
    description: 'Updated scholarship description',
  };

  beforeEach(async () => {
    const mockScholarshipsRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByAdvisor: jest.fn(),
      findByUniversity: jest.fn(), // Fix: Use correct method name
      findByAdvisorAndId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockUniversitiesRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScholarshipsService,
        {
          provide: ScholarshipsRepository,
          useValue: mockScholarshipsRepository,
        },
        {
          provide: UniversitiesRepository,
          useValue: mockUniversitiesRepository,
        },
      ],
    }).compile();

    service = module.get<ScholarshipsService>(ScholarshipsService);
    scholarshipsRepository = module.get(ScholarshipsRepository);
    universitiesRepository = module.get(UniversitiesRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createScholarship', () => {
    it('should create a scholarship successfully', async () => {
      universitiesRepository.findById.mockResolvedValue(mockUniversity);
      scholarshipsRepository.create.mockResolvedValue(mockScholarship);

      const result = await service.createScholarship(
        mockCreateScholarshipDto,
        mockAdvisorUser,
      );

      expect(universitiesRepository.findById).toHaveBeenCalledWith(
        'university-1',
      );
      expect(scholarshipsRepository.create).toHaveBeenCalledWith({
        ...mockCreateScholarshipDto,
        deadline: new Date('2024-12-31T23:59:59.000Z'),
        advisor: mockAdvisorUser,
        advisorId: mockAdvisorUser.id,
      });
      expect(result).toEqual(mockScholarship);
    });

    it('should throw UnauthorizedException if user is not an advisor', async () => {
      await expect(
        service.createScholarship(mockCreateScholarshipDto, mockStudentUser),
      ).rejects.toThrow(UnauthorizedException);

      expect(universitiesRepository.findById).not.toHaveBeenCalled();
      expect(scholarshipsRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if university does not exist', async () => {
      universitiesRepository.findById.mockResolvedValue(null);

      await expect(
        service.createScholarship(mockCreateScholarshipDto, mockAdvisorUser),
      ).rejects.toThrow(NotFoundException);

      expect(universitiesRepository.findById).toHaveBeenCalledWith(
        'university-1',
      );
      expect(scholarshipsRepository.create).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if advisor does not own the university', async () => {
      const mockUniversityWithDifferentAdvisor = {
        ...mockUniversity,
        advisorId: 'different-advisor-id',
      };
      universitiesRepository.findById.mockResolvedValue(
        mockUniversityWithDifferentAdvisor,
      );

      await expect(
        service.createScholarship(mockCreateScholarshipDto, mockAdvisorUser),
      ).rejects.toThrow(UnauthorizedException);

      expect(universitiesRepository.findById).toHaveBeenCalledWith(
        'university-1',
      );
      expect(scholarshipsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    // Fix: Use correct method name
    it('should return all scholarships', async () => {
      const mockScholarships = [mockScholarship];
      scholarshipsRepository.findAll.mockResolvedValue(mockScholarships); // Fix: Return array directly

      const result = await service.findAll(); // Fix: Use correct method name

      expect(scholarshipsRepository.findAll).toHaveBeenCalledWith([
        'university',
      ]);
      expect(result).toEqual(mockScholarships);
    });
  });

  describe('findById', () => {
    // Fix: Use correct method name
    it('should return a scholarship by id', async () => {
      scholarshipsRepository.findById.mockResolvedValue(mockScholarship);

      const result = await service.findById('scholarship-1'); // Fix: Use correct method name

      expect(scholarshipsRepository.findById).toHaveBeenCalledWith(
        'scholarship-1',
        ['university'],
      );
      expect(result).toEqual(mockScholarship);
    });

    it('should throw NotFoundException if scholarship does not exist', async () => {
      scholarshipsRepository.findById.mockResolvedValue(null);

      await expect(
        service.findById('nonexistent-id'), // Fix: Use correct method name
      ).rejects.toThrow(NotFoundException);

      expect(scholarshipsRepository.findById).toHaveBeenCalledWith(
        'nonexistent-id',
        ['university'],
      );
    });
  });

  describe('findByUniversity', () => {
    // Fix: Use correct method name
    it('should return scholarships for a specific university', async () => {
      const mockScholarships = [mockScholarship];
      scholarshipsRepository.findByUniversity.mockResolvedValue(
        // Fix: Use correct method name
        mockScholarships,
      );

      const result = await service.findByUniversity('university-1'); // Fix: Use correct method name

      expect(scholarshipsRepository.findByUniversity).toHaveBeenCalledWith(
        // Fix: Use correct method name
        'university-1',
        ['university'],
      );
      expect(result).toEqual(mockScholarships);
    });
  });

  describe('findByAdvisor', () => {
    it('should return scholarships for a specific advisor', async () => {
      const mockScholarships = [mockScholarship];
      scholarshipsRepository.findByAdvisor.mockResolvedValue(mockScholarships);

      const result = await service.findByAdvisor('advisor-1');

      expect(scholarshipsRepository.findByAdvisor).toHaveBeenCalledWith(
        'advisor-1',
        ['university'],
      );
      expect(result).toEqual(mockScholarships);
    });
  });

  describe('updateScholarship', () => {
    it('should update a scholarship successfully', async () => {
      const updatedScholarship: Scholarship = {
        ...mockScholarship,
        name: mockUpdateScholarshipDto.name!, // Fix: Use correct property and ensure it's defined
        description: mockUpdateScholarshipDto.description!,
      };
      scholarshipsRepository.findByAdvisorAndId.mockResolvedValue(
        mockScholarship,
      );
      scholarshipsRepository.update.mockResolvedValue(updatedScholarship);

      const result = await service.updateScholarship(
        'scholarship-1',
        mockUpdateScholarshipDto,
        mockAdvisorUser,
      );

      expect(scholarshipsRepository.findByAdvisorAndId).toHaveBeenCalledWith(
        'advisor-1',
        'scholarship-1',
      );
      expect(scholarshipsRepository.update).toHaveBeenCalledWith(
        'scholarship-1',
        mockUpdateScholarshipDto,
      );
      expect(result).toEqual(updatedScholarship);
    });

    it('should throw UnauthorizedException if user is not an advisor', async () => {
      await expect(
        service.updateScholarship(
          'scholarship-1',
          mockUpdateScholarshipDto,
          mockStudentUser,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(scholarshipsRepository.findByAdvisorAndId).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if scholarship does not exist or user does not own it', async () => {
      scholarshipsRepository.findByAdvisorAndId.mockResolvedValue(null);

      await expect(
        service.updateScholarship(
          'nonexistent-id',
          mockUpdateScholarshipDto,
          mockAdvisorUser,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(scholarshipsRepository.findByAdvisorAndId).toHaveBeenCalledWith(
        'advisor-1',
        'nonexistent-id',
      );
      expect(scholarshipsRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteScholarship', () => {
    it('should delete a scholarship successfully', async () => {
      scholarshipsRepository.findByAdvisorAndId.mockResolvedValue(
        mockScholarship,
      );
      scholarshipsRepository.delete.mockResolvedValue(undefined);

      await service.deleteScholarship('scholarship-1', mockAdvisorUser);

      expect(scholarshipsRepository.findByAdvisorAndId).toHaveBeenCalledWith(
        'advisor-1',
        'scholarship-1',
      );
      expect(scholarshipsRepository.delete).toHaveBeenCalledWith(
        'scholarship-1',
      );
    });

    it('should throw UnauthorizedException if user is not an advisor', async () => {
      await expect(
        service.deleteScholarship('scholarship-1', mockStudentUser),
      ).rejects.toThrow(UnauthorizedException);

      expect(scholarshipsRepository.findByAdvisorAndId).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if scholarship does not exist or user does not own it', async () => {
      scholarshipsRepository.findByAdvisorAndId.mockResolvedValue(null);

      await expect(
        service.deleteScholarship('nonexistent-id', mockAdvisorUser),
      ).rejects.toThrow(NotFoundException);

      expect(scholarshipsRepository.findByAdvisorAndId).toHaveBeenCalledWith(
        'advisor-1',
        'nonexistent-id',
      );
      expect(scholarshipsRepository.delete).not.toHaveBeenCalled();
    });
  });
});
