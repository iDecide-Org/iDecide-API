import { Test, TestingModule } from '@nestjs/testing';
import { UniversitiesController } from './universities.controller';
import { UniversitiesService } from './universities.service';
import { HttpService } from '@nestjs/axios';
import { CreateUniversityDto } from './dto/create-university.dto';
import { User, UserType } from '../auth/users/user.entity';
import { Request } from 'express';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UniversityType } from './university.entity';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('UniversitiesController', () => {
  let controller: UniversitiesController;
  let universitiesService: jest.Mocked<UniversitiesService>;
  let httpService: jest.Mocked<HttpService>;

  const mockUser: User = {
    id: 'advisor-1',
    name: 'Test Advisor',
    email: 'advisor@example.com',
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
      communationEmail: 'advisor@example.com',
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
  } as User;

  // Fix: Create proper mock Request object
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
    url: '/universities',
    method: 'GET',
    headers: {},
    query: {},
    params: {},
    body: {},
    // Add other required Request properties as needed
  } as unknown as Request;

  const mockUniversity = {
    id: 'university-1',
    name: 'Test University',
    location: 'Test Location',
    type: UniversityType.PRIVATE,
    establishment: 1950,
    description: 'Test Description',
    website: 'https://test-university.edu',
    phone: '+1234567890',
    email: 'info@test-university.edu',
    image: 'test-logo.jpg',
    collegesCount: 10,
    majorsCount: 50,
    advisorId: 'advisor-1',
    advisor: mockUser,
    colleges: [],
    scholarships: [],
    createdAt: new Date('2023-01-01'),
    addedBy: mockUser,
    addedById: 'advisor-1',
  };

  const mockFile = {
    filename: 'test-logo.jpg',
    path: './uploads/universities/test-logo.jpg',
    originalname: 'logo.jpg',
    mimetype: 'image/jpeg',
    size: 12345,
    fieldname: 'image',
    encoding: '7bit',
    destination: './uploads/universities',
    buffer: Buffer.from(''),
    stream: undefined,
  } as Express.Multer.File;

  // Mock successful Wikidata response
  const mockWikidataResponse: AxiosResponse = {
    data: {
      results: {
        bindings: [
          {
            arLabel: { value: 'جامعة القاهرة' },
            enLabel: { value: 'Cairo University' },
          },
          {
            arLabel: { value: 'جامعة الأزهر' },
            enLabel: { value: 'Al-Azhar University' },
          },
          {
            arLabel: { value: 'جامعة محدثة' },
            enLabel: { value: 'Updated University' },
          },
        ],
      },
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  };

  beforeEach(async () => {
    // Fix: Create mock service with proper return types
    const mockUniversitiesService = {
      addUniversity: jest.fn().mockResolvedValue(mockUniversity),
      getAllUniversities: jest.fn().mockResolvedValue([mockUniversity]),
      getUniversityById: jest.fn().mockResolvedValue(mockUniversity),
      updateUniversity: jest.fn().mockResolvedValue(mockUniversity),
      removeUniversity: jest.fn().mockResolvedValue(undefined),
      getUniversitiesByAdvisor: jest.fn().mockResolvedValue([mockUniversity]),
    };

    // Fix: Properly mock HttpService to return Observable
    const mockHttpService = {
      get: jest.fn().mockReturnValue(of(mockWikidataResponse)),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UniversitiesController],
      providers: [
        {
          provide: UniversitiesService,
          useValue: mockUniversitiesService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    controller = module.get<UniversitiesController>(UniversitiesController);
    universitiesService = module.get(UniversitiesService);
    httpService = module.get(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addUniversity', () => {
    it('should create university successfully with file upload', async () => {
      // Arrange
      const createUniversityDto: CreateUniversityDto = {
        name: 'جامعة القاهرة',
        type: UniversityType.GOVERNMENTAL,
        location: 'القاهرة، مصر',
        establishment: '1908',
        description: 'جامعة حكومية مصرية',
        collegesCount: '15',
        majorsCount: '120',
        website: 'https://cu.edu.eg',
        phone: '+20-2-35676105',
        email: 'info@cu.edu.eg',
      };

      // Act
      const result = await controller.addUniversity(
        createUniversityDto,
        mockFile,
        mockRequest,
      );

      // Assert
      expect(httpService.get).toHaveBeenCalled(); // Wikidata validation was called
      expect(universitiesService.addUniversity).toHaveBeenCalledWith(
        createUniversityDto,
        '/uploads/universities/test-logo.jpg',
        mockUser,
      );
      expect(result).toEqual(mockUniversity);
    });

    it('should create university successfully without file upload', async () => {
      // Arrange
      const createUniversityDto: CreateUniversityDto = {
        name: 'جامعة الأزهر',
        type: UniversityType.GOVERNMENTAL,
        location: 'القاهرة، مصر',
        establishment: '970',
        description: 'جامعة إسلامية',
        collegesCount: '20',
        majorsCount: '150',
        website: 'https://azhar.edu.eg',
        phone: '+20-2-25621500',
        email: 'info@azhar.edu.eg',
      };

      // Act
      const result = await controller.addUniversity(
        createUniversityDto,
        undefined,
        mockRequest,
      );

      // Assert
      expect(httpService.get).toHaveBeenCalled(); // Wikidata validation was called
      expect(universitiesService.addUniversity).toHaveBeenCalledWith(
        createUniversityDto,
        null,
        mockUser,
      );
      expect(result).toEqual(mockUniversity);
    });

    it('should handle service errors during creation', async () => {
      // Arrange
      const createUniversityDto: CreateUniversityDto = {
        name: 'جامعة القاهرة', // Use a valid name to pass Wikidata validation
        type: UniversityType.PRIVATE,
        location: 'القاهرة، مصر',
        establishment: '2000',
        description: 'جامعة خاصة',
        collegesCount: '5',
        majorsCount: '25',
      };

      universitiesService.addUniversity.mockRejectedValue(
        new BadRequestException('University already exists'),
      );

      // Act & Assert
      await expect(
        controller.addUniversity(createUniversityDto, mockFile, mockRequest),
      ).rejects.toThrow('University already exists');
    });

    it('should reject invalid university name', async () => {
      // Arrange
      const createUniversityDto: CreateUniversityDto = {
        name: 'جامعة غير موجودة', // Invalid name
        type: UniversityType.PRIVATE,
        location: 'القاهرة، مصر',
        establishment: '2000',
        description: 'جامعة خاصة',
        collegesCount: '5',
        majorsCount: '25',
      };

      // Mock empty Wikidata response for invalid name
      const emptyResponse: AxiosResponse = {
        ...mockWikidataResponse,
        data: { results: { bindings: [] } },
      };
      httpService.get.mockReturnValue(of(emptyResponse));

      // Act & Assert
      await expect(
        controller.addUniversity(createUniversityDto, mockFile, mockRequest),
      ).rejects.toThrow('is not a recognized university in Egypt');
    });
  });

  describe('getAllUniversities', () => {
    it('should return all universities', async () => {
      // Act
      const result = await controller.getAllUniversities();

      // Assert
      expect(universitiesService.getAllUniversities).toHaveBeenCalledWith();
      expect(result).toEqual([mockUniversity]);
    });

    it('should handle empty results', async () => {
      // Arrange
      universitiesService.getAllUniversities.mockResolvedValue([]);

      // Act
      const result = await controller.getAllUniversities();

      // Assert
      expect(universitiesService.getAllUniversities).toHaveBeenCalledWith();
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      // Arrange
      universitiesService.getAllUniversities.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(controller.getAllUniversities()).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getUniversity', () => {
    it('should return university by ID', async () => {
      // Arrange
      const universityId = 'university-1';

      // Act
      const result = await controller.getUniversity(universityId);

      // Assert
      expect(universitiesService.getUniversityById).toHaveBeenCalledWith(
        universityId,
      );
      expect(result).toEqual(mockUniversity);
    });

    it('should handle university not found', async () => {
      // Arrange
      const universityId = 'non-existent';
      universitiesService.getUniversityById.mockResolvedValue(null);

      // Act
      const result = await controller.getUniversity(universityId);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle invalid UUID format', async () => {
      // Arrange
      const invalidId = 'invalid-uuid';
      universitiesService.getUniversityById.mockRejectedValue(
        new BadRequestException('Invalid UUID format'),
      );

      // Act & Assert
      await expect(controller.getUniversity(invalidId)).rejects.toThrow(
        'Invalid UUID format',
      );
    });
  });

  describe('updateUniversity', () => {
    it('should update university successfully', async () => {
      // Arrange
      const universityId = 'university-1';
      const updateDto = {
        name: 'جامعة محدثة',
        description: 'وصف محدث',
      };

      const updatedUniversity = { ...mockUniversity, ...updateDto };
      universitiesService.updateUniversity.mockResolvedValue(updatedUniversity);

      // Act
      const result = await controller.updateUniversity(
        universityId,
        updateDto,
        undefined,
        mockRequest,
      );

      // Assert
      expect(httpService.get).toHaveBeenCalled(); // Wikidata validation was called
      expect(universitiesService.updateUniversity).toHaveBeenCalledWith(
        universityId,
        updateDto,
        undefined,
        mockUser,
      );
      expect(result).toEqual(updatedUniversity);
    });

    it('should update university without name change', async () => {
      // Arrange
      const universityId = 'university-1';
      const updateDto = {
        description: 'وصف محدث فقط',
        // No name change, so no Wikidata validation needed
      };

      const updatedUniversity = { ...mockUniversity, ...updateDto };
      universitiesService.updateUniversity.mockResolvedValue(updatedUniversity);

      // Act
      const result = await controller.updateUniversity(
        universityId,
        updateDto,
        undefined,
        mockRequest,
      );

      // Assert
      expect(httpService.get).not.toHaveBeenCalled(); // No Wikidata validation needed
      expect(universitiesService.updateUniversity).toHaveBeenCalledWith(
        universityId,
        updateDto,
        undefined,
        mockUser,
      );
      expect(result).toEqual(updatedUniversity);
    });

    it('should throw UnauthorizedException for ownership validation failure', async () => {
      // Arrange
      const universityId = 'university-1';
      const updateDto = { description: 'وصف محدث' }; // No name change

      universitiesService.updateUniversity.mockRejectedValue(
        new UnauthorizedException('Not authorized to update this university'),
      );

      // Act & Assert
      await expect(
        controller.updateUniversity(
          universityId,
          updateDto,
          undefined,
          mockRequest,
        ),
      ).rejects.toThrow('Not authorized to update this university');
    });

    it('should handle update service errors', async () => {
      // Arrange
      const universityId = 'university-1';
      const updateDto = { description: 'وصف محدث' }; // No name change

      universitiesService.updateUniversity.mockRejectedValue(
        new BadRequestException('Update failed'),
      );

      // Act & Assert
      await expect(
        controller.updateUniversity(
          universityId,
          updateDto,
          undefined,
          mockRequest,
        ),
      ).rejects.toThrow('Update failed');
    });

    it('should reject invalid university name on update', async () => {
      // Arrange
      const universityId = 'university-1';
      const updateDto = { name: 'جامعة غير صحيحة' };

      // Mock empty Wikidata response for invalid name
      const emptyResponse: AxiosResponse = {
        ...mockWikidataResponse,
        data: { results: { bindings: [] } },
      };
      httpService.get.mockReturnValue(of(emptyResponse));

      // Act & Assert
      await expect(
        controller.updateUniversity(
          universityId,
          updateDto,
          undefined,
          mockRequest,
        ),
      ).rejects.toThrow('is not a recognized university in Egypt');
    });
  });

  describe('removeUniversity', () => {
    it('should delete university successfully', async () => {
      // Arrange
      const universityId = 'university-1';

      // Act
      await controller.removeUniversity(universityId, mockRequest);

      // Assert
      expect(universitiesService.removeUniversity).toHaveBeenCalledWith(
        universityId,
        mockUser,
      );
    });

    it('should throw UnauthorizedException for ownership validation failure', async () => {
      // Arrange
      const universityId = 'university-1';
      universitiesService.removeUniversity.mockRejectedValue(
        new UnauthorizedException('Not authorized to delete this university'),
      );

      // Act & Assert
      await expect(
        controller.removeUniversity(universityId, mockRequest),
      ).rejects.toThrow('Not authorized to delete this university');
    });

    it('should handle deletion service errors', async () => {
      // Arrange
      const universityId = 'university-1';
      universitiesService.removeUniversity.mockRejectedValue(
        new Error('Deletion failed'),
      );

      // Act & Assert
      await expect(
        controller.removeUniversity(universityId, mockRequest),
      ).rejects.toThrow('Deletion failed');
    });
  });

  describe('getAdvisorUniversities', () => {
    it('should return universities for logged-in advisor', async () => {
      // Act
      const result = await controller.getAdvisorUniversities(mockRequest);

      // Assert
      expect(universitiesService.getUniversitiesByAdvisor).toHaveBeenCalledWith(
        'advisor-1',
      );
      expect(result).toEqual([mockUniversity]);
    });

    it('should handle empty results', async () => {
      // Arrange
      universitiesService.getUniversitiesByAdvisor.mockResolvedValue([]);

      // Act
      const result = await controller.getAdvisorUniversities(mockRequest);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      // Arrange
      universitiesService.getUniversitiesByAdvisor.mockRejectedValue(
        new Error('Service error'),
      );

      // Act & Assert
      await expect(
        controller.getAdvisorUniversities(mockRequest),
      ).rejects.toThrow('Service error');
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
