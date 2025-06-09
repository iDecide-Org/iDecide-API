import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CollegesService } from './colleges.service';
import { CollegesRepository } from './colleges.repository';
import { User, UserType } from '../auth/users/user.entity';
import { College } from './entities/college.entity';
import { CreateCollegeDto } from './dto/create-college.dto';
import { UpdateCollegeDto } from './dto/update-college.dto';
import { University, UniversityType } from '../universities/university.entity';

describe('CollegesService', () => {
  let service: CollegesService;
  let repository: jest.Mocked<CollegesRepository>;

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
      // Fix: Add missing Advisor properties
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

  const mockCollege: College = {
    id: 'college-id',
    name: 'Test College',
    description: 'Test Description',
    location: 'Test Location',
    website: 'https://test.edu',
    universityId: 'university-id',
    university: null,
    majors: [],
  };

  // Fix: Create a complete University mock with correct enum value and properties
  // Fix: Create a complete University mock with correct enum value and properties
  const mockUniversity: University = {
    id: 'university-id',
    name: 'Test University',
    location: 'Test Location',
    type: UniversityType.PRIVATE, // Fix: Use correct enum value
    establishment: 1950,
    description: 'Test University Description',
    website: 'https://test-university.edu',
    phone: '+1234567890',
    email: 'info@test-university.edu',
    image: 'university-image.jpg',
    collegesCount: 10,
    majorsCount: 50,
    advisorId: 'advisor-id',
    advisor: mockAdvisor,
    colleges: [],
    scholarships: [],
    createdAt: new Date(),
    addedBy: mockAdvisor,
    addedById: 'advisor-id',
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByUniversity: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUniversityById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollegesService,
        { provide: CollegesRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<CollegesService>(CollegesService);
    repository = module.get(CollegesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateCollegeDto = {
      name: 'Test College',
      description: 'Test Description',
      location: 'Test Location',
      website: 'https://test.edu',
      universityId: 'university-id',
    };

    it('should create college successfully', async () => {
      repository.findUniversityById.mockResolvedValue(mockUniversity);
      repository.create.mockResolvedValue(mockCollege);

      const result = await service.create(createDto, mockAdvisor);

      expect(repository.findUniversityById).toHaveBeenCalledWith(
        createDto.universityId,
      );
      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        university: mockUniversity,
      });
      expect(result).toEqual(mockCollege);
    });

    it('should throw NotFoundException if university not found', async () => {
      repository.findUniversityById.mockResolvedValue(null);

      await expect(service.create(createDto, mockAdvisor)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.findUniversityById).toHaveBeenCalledWith(
        createDto.universityId,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if advisor does not own university', async () => {
      const differentUniversity: University = {
        ...mockUniversity,
        advisorId: 'different-advisor',
      };
      repository.findUniversityById.mockResolvedValue(differentUniversity);

      await expect(service.create(createDto, mockAdvisor)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(repository.findUniversityById).toHaveBeenCalledWith(
        createDto.universityId,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user is not an advisor', async () => {
      const studentUser = { ...mockAdvisor, type: UserType.STUDENT };

      await expect(service.create(createDto, studentUser)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(repository.findUniversityById).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all colleges', async () => {
      const colleges = [mockCollege];
      repository.findAll.mockResolvedValue(colleges);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalledWith(['university', 'majors']);
      expect(result).toEqual(colleges);
    });
  });

  describe('findAllByUniversity', () => {
    it('should return colleges for university', async () => {
      const colleges = [mockCollege];
      repository.findByUniversity.mockResolvedValue(colleges);

      const result = await service.findAllByUniversity('university-id');

      expect(repository.findByUniversity).toHaveBeenCalledWith(
        'university-id',
        ['university', 'majors'],
      );
      expect(result).toEqual(colleges);
    });
  });

  describe('findOne', () => {
    it('should return college if found', async () => {
      repository.findById.mockResolvedValue(mockCollege);

      const result = await service.findOne('college-id');

      expect(repository.findById).toHaveBeenCalledWith('college-id', [
        'university',
        'majors',
      ]);
      expect(result).toEqual(mockCollege);
    });

    it('should throw NotFoundException if college not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.findById).toHaveBeenCalledWith('non-existent-id', [
        'university',
        'majors',
      ]);
    });
  });

  describe('update', () => {
    const updateDto: UpdateCollegeDto = { name: 'Updated College' };

    const mockCollegeWithUniversity: College = {
      ...mockCollege,
      university: mockUniversity,
    };

    it('should update college if user owns the university', async () => {
      const updatedCollege = { ...mockCollege, ...updateDto };
      repository.findById.mockResolvedValue(mockCollegeWithUniversity);
      repository.update.mockResolvedValue(updatedCollege);

      const result = await service.update('college-id', updateDto, mockAdvisor);

      expect(repository.findById).toHaveBeenCalledWith('college-id', [
        'university',
      ]);
      expect(repository.update).toHaveBeenCalledWith('college-id', updateDto);
      expect(result).toEqual(updatedCollege);
    });

    it('should throw NotFoundException if college not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', updateDto, mockAdvisor),
      ).rejects.toThrow(NotFoundException);
      expect(repository.findById).toHaveBeenCalledWith('non-existent-id', [
        'university',
      ]);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user does not own university', async () => {
      const differentUniversityCollege: College = {
        ...mockCollegeWithUniversity,
        university: { ...mockUniversity, advisorId: 'different-advisor' },
      };
      repository.findById.mockResolvedValue(differentUniversityCollege);

      await expect(
        service.update('college-id', updateDto, mockAdvisor),
      ).rejects.toThrow(UnauthorizedException);
      expect(repository.findById).toHaveBeenCalledWith('college-id', [
        'university',
      ]);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user is not an advisor', async () => {
      const studentUser = { ...mockAdvisor, type: UserType.STUDENT };

      await expect(
        service.update('college-id', updateDto, studentUser),
      ).rejects.toThrow(UnauthorizedException);
      expect(repository.findById).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const mockCollegeWithUniversity: College = {
      ...mockCollege,
      university: mockUniversity,
    };

    it('should delete college if user owns the university', async () => {
      repository.findById.mockResolvedValue(mockCollegeWithUniversity);
      repository.delete.mockResolvedValue(undefined);

      await service.remove('college-id', mockAdvisor);

      expect(repository.findById).toHaveBeenCalledWith('college-id', [
        'university',
      ]);
      expect(repository.delete).toHaveBeenCalledWith('college-id');
    });

    it('should throw NotFoundException if college not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.remove('non-existent-id', mockAdvisor),
      ).rejects.toThrow(NotFoundException);
      expect(repository.findById).toHaveBeenCalledWith('non-existent-id', [
        'university',
      ]);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user does not own university', async () => {
      const differentUniversityCollege: College = {
        ...mockCollegeWithUniversity,
        university: { ...mockUniversity, advisorId: 'different-advisor' },
      };
      repository.findById.mockResolvedValue(differentUniversityCollege);

      await expect(service.remove('college-id', mockAdvisor)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(repository.findById).toHaveBeenCalledWith('college-id', [
        'university',
      ]);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user is not an advisor', async () => {
      const studentUser = { ...mockAdvisor, type: UserType.STUDENT };

      await expect(service.remove('college-id', studentUser)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(repository.findById).not.toHaveBeenCalled();
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
