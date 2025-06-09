import { Test, TestingModule } from '@nestjs/testing';
import { MajorsService } from './majors.service';
import { MajorsRepository } from './majors.repository';
import { User, UserType } from '../auth/users/user.entity';
import { University, UniversityType } from '../universities/university.entity';
import { College } from '../colleges/entities/college.entity';
import { Major } from './entities/major.entity';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { CertificateType } from '../../src/auth/users/student.entity';

describe('MajorsService', () => {
  let service: MajorsService;
  let repository: jest.Mocked<MajorsRepository>;

  // Fix: Create proper User mock with all required properties
  const mockAdvisor: User = {
    id: 'advisor-1',
    name: 'Test Advisor',
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

  // Fix: Create proper Student user mock
  const mockStudent: User = {
    ...mockAdvisor,
    id: 'student-1',
    type: UserType.STUDENT,
    advisor: null,
    student: {
      id: 'student-profile-1',
      user: null,
      certificateType: CertificateType.BACHELOR,
      CertificatePic: null,
      StudyDivision: 'Science',
      totalScore: 85.5,
      nationality: 'Egyptian',
      isStudentCertified: true,
      isAlumni: false,
      isAlumniCertified: false,
      chatbotCompleted: false,
    },
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
    advisor: mockAdvisor,
    addedBy: mockAdvisor,
    addedById: 'advisor-1',
    colleges: [],
    scholarships: [],
    createdAt: new Date(),
  };

  // Fix: Create proper College mock with all required properties
  const mockCollege: College = {
    id: 'college-1',
    name: 'Engineering College',
    description: 'Engineering college description',
    location: 'Main Campus', // Fix: Add missing location property
    website: 'https://engineering.test-university.edu', // Fix: Add missing website property
    universityId: 'university-1',
    university: mockUniversity,
    majors: [],
  };

  const mockMajor: Major = {
    id: 'major-1',
    name: 'Computer Science',
    description: 'Computer Science major',
    collegeId: 'college-1',
    college: mockCollege,
  };

  const mockCreateMajorDto: CreateMajorDto = {
    name: 'Computer Science',
    description: 'Computer Science major',
    collegeId: 'college-1',
  };

  const mockUpdateMajorDto: UpdateMajorDto = {
    name: 'Updated Computer Science',
    description: 'Updated description',
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCollege: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findCollegeWithUniversity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MajorsService,
        {
          provide: MajorsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MajorsService>(MajorsService);
    repository = module.get(MajorsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a major successfully', async () => {
      repository.findCollegeWithUniversity.mockResolvedValue(mockCollege);
      repository.create.mockResolvedValue(mockMajor);

      const result = await service.create(mockCreateMajorDto, mockAdvisor);

      expect(repository.findCollegeWithUniversity).toHaveBeenCalledWith(
        mockCreateMajorDto.collegeId,
      );
      expect(repository.create).toHaveBeenCalledWith({
        ...mockCreateMajorDto,
        college: mockCollege,
        collegeId: mockCollege.id,
      });
      expect(result).toEqual(mockMajor);
    });

    it('should throw UnauthorizedException if user is not an advisor', async () => {
      await expect(
        service.create(mockCreateMajorDto, mockStudent),
      ).rejects.toThrow(UnauthorizedException);

      expect(repository.findCollegeWithUniversity).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if college not found', async () => {
      repository.findCollegeWithUniversity.mockResolvedValue(null);

      await expect(
        service.create(mockCreateMajorDto, mockAdvisor),
      ).rejects.toThrow(NotFoundException);

      expect(repository.findCollegeWithUniversity).toHaveBeenCalledWith(
        mockCreateMajorDto.collegeId,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if advisor does not own the university', async () => {
      const otherAdvisorCollege = {
        ...mockCollege,
        university: {
          ...mockUniversity,
          advisorId: 'other-advisor-id',
        },
      };
      repository.findCollegeWithUniversity.mockResolvedValue(
        otherAdvisorCollege,
      );

      await expect(
        service.create(mockCreateMajorDto, mockAdvisor),
      ).rejects.toThrow(UnauthorizedException);

      expect(repository.findCollegeWithUniversity).toHaveBeenCalledWith(
        mockCreateMajorDto.collegeId,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all majors', async () => {
      const majors = [mockMajor];
      repository.findAll.mockResolvedValue(majors);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalledWith([
        'college',
        'college.university',
      ]);
      expect(result).toEqual(majors);
    });

    it('should return empty array when no majors exist', async () => {
      repository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalledWith([
        'college',
        'college.university',
      ]);
      expect(result).toEqual([]);
    });
  });

  describe('findAllByCollege', () => {
    it('should return majors for a specific college', async () => {
      const majors = [mockMajor];
      repository.findByCollege.mockResolvedValue(majors);

      const result = await service.findAllByCollege('college-1');

      expect(repository.findByCollege).toHaveBeenCalledWith('college-1', [
        'college',
        'college.university',
      ]);
      expect(result).toEqual(majors);
    });

    it('should return empty array when college has no majors', async () => {
      repository.findByCollege.mockResolvedValue([]);

      const result = await service.findAllByCollege('college-1');

      expect(repository.findByCollege).toHaveBeenCalledWith('college-1', [
        'college',
        'college.university',
      ]);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a major by id', async () => {
      repository.findById.mockResolvedValue(mockMajor);

      const result = await service.findOne('major-1');

      expect(repository.findById).toHaveBeenCalledWith('major-1', [
        'college',
        'college.university',
      ]);
      expect(result).toEqual(mockMajor);
    });

    it('should throw NotFoundException if major not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );

      expect(repository.findById).toHaveBeenCalledWith('non-existent-id', [
        'college',
        'college.university',
      ]);
    });
  });

  describe('update', () => {
    it('should update a major successfully', async () => {
      const updatedMajor = { ...mockMajor, ...mockUpdateMajorDto };
      repository.findById.mockResolvedValue(mockMajor);
      repository.update.mockResolvedValue(updatedMajor);

      const result = await service.update(
        'major-1',
        mockUpdateMajorDto,
        mockAdvisor,
      );

      expect(repository.findById).toHaveBeenCalledWith('major-1', [
        'college',
        'college.university',
      ]);
      expect(repository.update).toHaveBeenCalledWith(
        'major-1',
        mockUpdateMajorDto,
      );
      expect(result).toEqual(updatedMajor);
    });

    it('should throw UnauthorizedException if user is not an advisor', async () => {
      await expect(
        service.update('major-1', mockUpdateMajorDto, mockStudent),
      ).rejects.toThrow(UnauthorizedException);

      expect(repository.findById).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if major not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', mockUpdateMajorDto, mockAdvisor),
      ).rejects.toThrow(NotFoundException);

      expect(repository.findById).toHaveBeenCalledWith('non-existent-id', [
        'college',
        'college.university',
      ]);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if advisor does not own the university', async () => {
      const otherAdvisorMajor = {
        ...mockMajor,
        college: {
          ...mockCollege,
          university: {
            ...mockUniversity,
            advisorId: 'other-advisor-id',
          },
        },
      };
      repository.findById.mockResolvedValue(otherAdvisorMajor);

      await expect(
        service.update('major-1', mockUpdateMajorDto, mockAdvisor),
      ).rejects.toThrow(UnauthorizedException);

      expect(repository.findById).toHaveBeenCalledWith('major-1', [
        'college',
        'college.university',
      ]);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a major successfully', async () => {
      repository.findById.mockResolvedValue(mockMajor);
      repository.delete.mockResolvedValue(undefined);

      await service.remove('major-1', mockAdvisor);

      expect(repository.findById).toHaveBeenCalledWith('major-1', [
        'college',
        'college.university',
      ]);
      expect(repository.delete).toHaveBeenCalledWith('major-1');
    });

    it('should throw UnauthorizedException if user is not an advisor', async () => {
      await expect(service.remove('major-1', mockStudent)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(repository.findById).not.toHaveBeenCalled();
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if major not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.remove('non-existent-id', mockAdvisor),
      ).rejects.toThrow(NotFoundException);

      expect(repository.findById).toHaveBeenCalledWith('non-existent-id', [
        'college',
        'college.university',
      ]);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if advisor does not own the university', async () => {
      const otherAdvisorMajor = {
        ...mockMajor,
        college: {
          ...mockCollege,
          university: {
            ...mockUniversity,
            advisorId: 'other-advisor-id',
          },
        },
      };
      repository.findById.mockResolvedValue(otherAdvisorMajor);

      await expect(service.remove('major-1', mockAdvisor)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(repository.findById).toHaveBeenCalledWith('major-1', [
        'college',
        'college.university',
      ]);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should propagate repository errors', async () => {
      const dbError = new Error('Database connection failed');
      repository.findAll.mockRejectedValue(dbError);

      await expect(service.findAll()).rejects.toThrow(
        'Database connection failed',
      );

      expect(repository.findAll).toHaveBeenCalledWith([
        'college',
        'college.university',
      ]);
    });

    it('should handle repository errors during creation', async () => {
      repository.findCollegeWithUniversity.mockResolvedValue(mockCollege);
      repository.create.mockRejectedValue(new Error('Creation failed'));

      await expect(
        service.create(mockCreateMajorDto, mockAdvisor),
      ).rejects.toThrow('Creation failed');

      expect(repository.findCollegeWithUniversity).toHaveBeenCalledWith(
        mockCreateMajorDto.collegeId,
      );
      expect(repository.create).toHaveBeenCalled();
    });
  });
});
