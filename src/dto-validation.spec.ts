import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateUniversityDto } from './universities/dto/create-university.dto';
import { CreateCollegeDto } from './colleges/dto/create-college.dto';
import { CreateMajorDto } from './majors/dto/create-major.dto';
import { CreateScholarshipDto } from './scholarships/dto/create-scholarship.dto';
import { SignupDto } from './auth/dto/signup.dto';
import { UserType } from './auth/users/user.entity';
import {
  ScholarshipType,
  ScholarshipCoverage,
} from './scholarships/scholarship.entity';

describe('Enhanced DTOs Validation Tests', () => {
  describe('CreateUniversityDto', () => {
    it('should pass validation with valid data', async () => {
      const validData = {
        name: 'جامعة القاهرة', // Arabic text as required
        type: 'حكومية', // Use Arabic enum value
        location: 'القاهرة، مصر',
        description: 'جامعة مرموقة في مصر',
        establishment: '1908', // String format as required
        website: 'https://cu.edu.eg',
        phone: '+201234567890',
        email: 'info@cu.edu.eg',
        collegesCount: '15', // String format as required
        majorsCount: '120', // String format as required
        image: 'https://example.com/university-logo.jpg',
      };

      const dto = plainToClass(CreateUniversityDto, validData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid name length', async () => {
      const invalidData = {
        name: 'A', // Too short and not Arabic
        type: 'حكومية',
        location: 'Cairo',
        establishment: '1908',
        collegesCount: '15',
        majorsCount: '120',
      };

      const dto = plainToClass(CreateUniversityDto, invalidData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail validation with invalid website URL', async () => {
      const invalidData = {
        name: 'جامعة القاهرة',
        type: 'حكومية',
        location: 'Cairo',
        establishment: '1908',
        website: 'invalid-url', // Invalid URL
        collegesCount: '15',
        majorsCount: '120',
      };

      const dto = plainToClass(CreateUniversityDto, invalidData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('CreateCollegeDto', () => {
    it('should pass validation with valid data', async () => {
      const validData = {
        name: 'Faculty of Engineering',
        description: 'Engineering college with various programs',
        location: 'Main Campus',
        website: 'https://engineering.cu.edu.eg',
        universityId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID format
      };

      const dto = plainToClass(CreateCollegeDto, validData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid university ID', async () => {
      const invalidData = {
        name: 'Faculty of Engineering',
        universityId: 'invalid-uuid',
      };

      const dto = plainToClass(CreateCollegeDto, invalidData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('CreateMajorDto', () => {
    it('should pass validation with valid data', async () => {
      const validData = {
        name: 'Computer Science',
        description: 'Study of algorithms and computational systems',
        collegeId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID format
      };

      const dto = plainToClass(CreateMajorDto, validData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('CreateScholarshipDto', () => {
    it('should pass validation with valid data', async () => {
      const validData = {
        name: 'Merit Scholarship', // Required field
        provider: 'University Foundation', // Required field
        type: ScholarshipType.FULL, // Use correct enum value
        description: 'Scholarship for outstanding students',
        eligibility: 'Minimum GPA 3.5',
        deadline: '2025-12-31T23:59:59.000Z', // ISO date string
        link: 'https://university.edu/scholarship', // Required field
        coverage: [
          ScholarshipCoverage.TUITION,
          ScholarshipCoverage.LIVING_EXPENSES, // Fixed: Use LIVING_EXPENSES instead of ACCOMMODATION
        ], // Use correct enum values
        country: 'Egypt',
        fieldOfStudy: 'Engineering',
        universityId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
      };

      const dto = plainToClass(CreateScholarshipDto, validData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid scholarship type', async () => {
      const invalidData = {
        name: 'Merit Scholarship',
        provider: 'University',
        type: 'INVALID_TYPE', // Invalid enum value
        description: 'Test scholarship',
        eligibility: 'Test criteria',
        deadline: '2025-12-31T23:59:59.000Z',
        link: 'https://test.com',
        coverage: [ScholarshipCoverage.TUITION],
        universityId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const dto = plainToClass(CreateScholarshipDto, invalidData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('SignupDto', () => {
    it('should pass validation with valid data', async () => {
      const validData = {
        name: 'أحمد محمد', // Fixed: SignupDto uses 'name' not 'firstName/lastName'
        email: 'ahmed@example.com',
        password: 'StrongPass123!',
        type: UserType.STUDENT, // Use enum value from UserType
      };

      const dto = plainToClass(SignupDto, validData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with weak password', async () => {
      const invalidData = {
        name: 'أحمد محمد',
        email: 'ahmed@example.com',
        password: '123', // Weak password
        type: UserType.STUDENT,
      };

      const dto = plainToClass(SignupDto, invalidData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation with invalid email', async () => {
      const invalidData = {
        name: 'أحمد محمد',
        email: 'invalid-email', // Invalid email format
        password: 'StrongPass123!',
        type: UserType.STUDENT,
      };

      const dto = plainToClass(SignupDto, invalidData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should trim and lowercase email', async () => {
      const validData = {
        name: 'أحمد محمد',
        email: '  AHMED@EXAMPLE.COM  ', // Uppercase with spaces
        password: 'StrongPass123!',
        type: UserType.STUDENT, // Use enum value
      };

      const dto = plainToClass(SignupDto, validData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.email).toBe('ahmed@example.com'); // Should be trimmed and lowercased
    });
  });
});
