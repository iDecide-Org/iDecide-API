import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateUniversityDto } from '../src/universities/dto/create-university.dto';
import { CreateCollegeDto } from '../src/colleges/dto/create-college.dto';
import { CreateMajorDto } from '../src/majors/dto/create-major.dto';
import { CreateScholarshipDto } from '../src/scholarships/dto/create-scholarship.dto';
import { SignupDto } from '../src/auth/dto/signup.dto';
import { UserType } from '../src/auth/users/user.entity';

describe('Enhanced DTOs Validation Tests', () => {
  describe('CreateUniversityDto', () => {
    it('should pass validation with valid data', async () => {
      const validData = {
        name: 'Cairo University',
        description: 'A prestigious university in Egypt',
        location: 'Cairo, Egypt',
        website: 'https://cu.edu.eg',
        ranking: 150,
        established: 1908,
        type: 'PUBLIC',
        accreditation: 'NAQAAE',
      };

      const dto = plainToClass(CreateUniversityDto, validData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid name length', async () => {
      const invalidData = {
        name: 'A', // Too short
        location: 'Cairo, Egypt',
        website: 'https://cu.edu.eg',
      };

      const dto = plainToClass(CreateUniversityDto, invalidData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('length');
    });

    it('should fail validation with invalid website URL', async () => {
      const invalidData = {
        name: 'Cairo University',
        location: 'Cairo, Egypt',
        website: 'invalid-url',
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
        universityId: '123e4567-e89b-12d3-a456-426614174000',
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
        collegeId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const dto = plainToClass(CreateMajorDto, validData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('CreateScholarshipDto', () => {
    it('should pass validation with valid data', async () => {
      const validData = {
        title: 'Merit Scholarship',
        description: 'Scholarship for outstanding students',
        amount: 5000,
        currency: 'USD',
        type: 'MERIT',
        coverage: 'TUITION',
        eligibility: 'Minimum GPA 3.5',
        deadline: '2025-12-31',
        applicationLink: 'https://university.edu/scholarship',
        universityId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const dto = plainToClass(CreateScholarshipDto, validData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid scholarship type', async () => {
      const invalidData = {
        title: 'Merit Scholarship',
        type: 'INVALID_TYPE',
        universityId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const dto = plainToClass(CreateScholarshipDto, invalidData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('SignupDto', () => {
    it('should pass validation with valid data', async () => {
      const validData = {
        name: 'Ahmed Mohamed Ali',
        email: 'ahmed.mohamed@example.com',
        password: 'SecurePass123!',
        type: UserType.STUDENT,
      };

      const dto = plainToClass(SignupDto, validData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with weak password', async () => {
      const invalidData = {
        name: 'Ahmed Mohamed Ali',
        email: 'ahmed.mohamed@example.com',
        password: 'weak', // Weak password
        type: UserType.STUDENT,
      };

      const dto = plainToClass(SignupDto, invalidData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation with invalid email', async () => {
      const invalidData = {
        name: 'Ahmed Mohamed Ali',
        email: 'invalid-email',
        password: 'SecurePass123!',
        type: UserType.STUDENT,
      };

      const dto = plainToClass(SignupDto, invalidData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should trim and lowercase email', async () => {
      const dataWithSpaces = {
        name: '  Ahmed Mohamed Ali  ',
        email: '  AHMED.MOHAMED@EXAMPLE.COM  ',
        password: 'SecurePass123!',
        type: UserType.STUDENT,
      };

      const dto = plainToClass(SignupDto, dataWithSpaces);
      expect(dto.name).toBe('Ahmed Mohamed Ali');
      expect(dto.email).toBe('ahmed.mohamed@example.com');
    });
  });
});
