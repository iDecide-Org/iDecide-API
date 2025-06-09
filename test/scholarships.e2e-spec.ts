import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { testHelper, TestUser } from './test-utils';
import { UserType } from '../src/auth/users/user.entity';
import { University } from '../src/universities/university.entity';
import {
  ScholarshipType,
  ScholarshipCoverage,
} from '../src/scholarships/scholarship.entity';

describe('Scholarships Integration Tests', () => {
  let app: INestApplication;
  let advisorUser: TestUser;
  let studentUser: TestUser;
  let testUniversity: University;

  beforeAll(async () => {
    app = await testHelper.setupTestApp();
  }, 120000); // 2 minute timeout for setup

  beforeEach(async () => {
    await testHelper.cleanDatabase();

    // Create test users
    advisorUser = await testHelper.createTestUser({
      name: 'Test Advisor',
      email: 'advisor@test.com',
      type: UserType.ADVISOR,
    });

    studentUser = await testHelper.createTestUser({
      name: 'Test Student',
      email: 'student@test.com',
      type: UserType.STUDENT,
    });

    // Create profiles
    await testHelper.createAdvisorProfile(advisorUser.id);
    await testHelper.createStudentProfile(studentUser.id);

    // Create test university
    testUniversity = await testHelper.createTestUniversity(advisorUser.id, {
      name: 'Test University for Scholarships',
    });
  });

  afterAll(async () => {
    await testHelper.closeApp();
  });

  describe('POST /api/scholarships', () => {
    it('should create scholarship successfully with advisor user', async () => {
      const scholarshipData = {
        name: 'Merit Scholarship',
        provider: 'Test University Foundation',
        type: ScholarshipType.FULL,
        deadline: '2024-12-31',
        description: 'A comprehensive scholarship for outstanding students',
        eligibility: 'GPA > 3.5, Financial need',
        coverage: [
          ScholarshipCoverage.TUITION,
          ScholarshipCoverage.LIVING_EXPENSES,
        ],
        link: 'https://university.edu/scholarships/merit',
        universityId: testUniversity.id,
      };

      const response = await request(app.getHttpServer())
        .post('/api/scholarships')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send(scholarshipData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Merit Scholarship');
      expect(response.body).toHaveProperty(
        'provider',
        'Test University Foundation',
      );
      expect(response.body).toHaveProperty('type', ScholarshipType.FULL);
      expect(response.body).toHaveProperty('coverage');
      expect(response.body.coverage).toContain(ScholarshipCoverage.TUITION);
      expect(response.body.coverage).toContain(
        ScholarshipCoverage.LIVING_EXPENSES,
      );
      expect(response.body).toHaveProperty('advisorId', advisorUser.id);
      expect(response.body).toHaveProperty('universityId', testUniversity.id);
    });

    it('should fail to create scholarship with student user', async () => {
      const scholarshipData = {
        name: 'Test Scholarship',
        provider: 'Test Provider',
        type: ScholarshipType.PARTIAL,
        deadline: '2024-12-31',
        description: 'Test Description',
        eligibility: 'Test Eligibility',
        coverage: [ScholarshipCoverage.TUITION],
        universityId: testUniversity.id,
      };

      const response = await request(app.getHttpServer())
        .post('/api/scholarships')
        .set(testHelper.getAuthHeader(studentUser.token!))
        .send(scholarshipData)
        .expect(403);

      expect(response.body.message).toContain('Only advisors');
    });

    it('should fail without authentication', async () => {
      const scholarshipData = {
        name: 'Test Scholarship',
        provider: 'Test Provider',
        type: ScholarshipType.PARTIAL,
        deadline: '2024-12-31',
        description: 'Test Description',
      };

      await request(app.getHttpServer())
        .post('/api/scholarships')
        .send(scholarshipData)
        .expect(401);
    });

    it('should fail with invalid data', async () => {
      const invalidData = {
        name: '', // Empty name
        type: 'INVALID_TYPE',
        // Missing required fields
      };

      const response = await request(app.getHttpServer())
        .post('/api/scholarships')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
    });

    it('should fail with non-existent university', async () => {
      const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';
      const scholarshipData = {
        name: 'Test Scholarship',
        provider: 'Test Provider',
        type: ScholarshipType.PARTIAL,
        deadline: '2024-12-31',
        description: 'Test Description',
        eligibility: 'Test Eligibility',
        coverage: [ScholarshipCoverage.TUITION],
        universityId: fakeUuid,
      };

      const response = await request(app.getHttpServer())
        .post('/api/scholarships')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send(scholarshipData)
        .expect(404);

      expect(response.body.message).toContain('University not found');
    });

    it('should fail when advisor does not own university', async () => {
      // Create another advisor and university
      const anotherAdvisor = await testHelper.createTestUser({
        name: 'Another Advisor',
        email: 'advisor2@test.com',
        type: UserType.ADVISOR,
      });
      await testHelper.createAdvisorProfile(anotherAdvisor.id);
      const anotherUniversity = await testHelper.createTestUniversity(
        anotherAdvisor.id,
        {
          name: 'Another University',
        },
      );

      const scholarshipData = {
        name: 'Unauthorized Scholarship',
        provider: 'Test Provider',
        type: ScholarshipType.PARTIAL,
        deadline: '2024-12-31',
        description: 'Test Description',
        eligibility: 'Test Eligibility',
        coverage: [ScholarshipCoverage.TUITION],
        universityId: anotherUniversity.id,
      };

      const response = await request(app.getHttpServer())
        .post('/api/scholarships')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send(scholarshipData)
        .expect(403);

      expect(response.body.message).toContain('not authorized');
    });
  });

  describe('GET /api/scholarships', () => {
    beforeEach(async () => {
      // Create test scholarships
      const scholarship1Data = {
        name: 'Academic Excellence Scholarship',
        provider: 'University Foundation',
        type: ScholarshipType.FULL,
        deadline: '2024-12-31',
        description: 'For top performers',
        eligibility: 'GPA > 3.8',
        coverage: [
          ScholarshipCoverage.TUITION,
          ScholarshipCoverage.LIVING_EXPENSES,
        ],
        universityId: testUniversity.id,
      };

      const scholarship2Data = {
        name: 'Need-Based Grant',
        provider: 'Government',
        type: ScholarshipType.PARTIAL,
        deadline: '2024-11-30',
        description: 'Financial assistance',
        eligibility: 'Financial need',
        coverage: [ScholarshipCoverage.LIVING_EXPENSES],
        universityId: testUniversity.id,
      };

      await request(app.getHttpServer())
        .post('/api/scholarships')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send(scholarship1Data)
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/scholarships')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send(scholarship2Data)
        .expect(201);
    });

    it('should get all scholarships', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/scholarships')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(2);

      const scholarshipNames = response.body.map((s: any) => s.name);
      expect(scholarshipNames).toContain('Academic Excellence Scholarship');
      expect(scholarshipNames).toContain('Need-Based Grant');
    });

    it('should return empty array when no scholarships exist', async () => {
      await testHelper.cleanDatabase();

      const response = await request(app.getHttpServer())
        .get('/api/scholarships')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/scholarships/:id', () => {
    let scholarshipId: string;

    beforeEach(async () => {
      const scholarshipData = {
        name: 'Test Scholarship for Get',
        provider: 'Test Provider',
        type: ScholarshipType.FULL,
        deadline: '2024-12-31',
        description: 'Detailed scholarship description',
        eligibility: 'Detailed eligibility criteria',
        coverage: [
          ScholarshipCoverage.TUITION,
          ScholarshipCoverage.TRAVEL,
          ScholarshipCoverage.LIVING_EXPENSES,
        ],
        link: 'https://test-scholarship.com',
        universityId: testUniversity.id,
      };

      const response = await request(app.getHttpServer())
        .post('/api/scholarships')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send(scholarshipData)
        .expect(201);

      scholarshipId = response.body.id;
    });

    it('should get scholarship by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/scholarships/${scholarshipId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', scholarshipId);
      expect(response.body).toHaveProperty('name', 'Test Scholarship for Get');
      expect(response.body).toHaveProperty(
        'description',
        'Detailed scholarship description',
      );
      expect(response.body).toHaveProperty('university');
      expect(response.body.university).toHaveProperty('id', testUniversity.id);
      expect(response.body).toHaveProperty('coverage');
      expect(response.body.coverage).toHaveLength(3);
    });

    it('should return 404 for non-existent scholarship', async () => {
      const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app.getHttpServer())
        .get(`/api/scholarships/${fakeUuid}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should fail with invalid UUID format', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/scholarships/invalid-uuid')
        .expect(400);

      expect(response.body.message).toContain('UUID');
    });
  });

  describe('PATCH /api/scholarships/:id', () => {
    let scholarshipId: string;

    beforeEach(async () => {
      const scholarshipData = {
        name: 'Scholarship to Update',
        provider: 'Original Provider',
        type: ScholarshipType.PARTIAL,
        deadline: '2024-12-31',
        description: 'Original description',
        eligibility: 'Original eligibility',
        coverage: [ScholarshipCoverage.TUITION],
        universityId: testUniversity.id,
      };

      const response = await request(app.getHttpServer())
        .post('/api/scholarships')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send(scholarshipData)
        .expect(201);

      scholarshipId = response.body.id;
    });

    it('should update scholarship successfully by owner', async () => {
      const updateData = {
        description: 'Updated description',
        eligibility: 'Updated eligibility criteria',
        coverage: [
          ScholarshipCoverage.TUITION,
          ScholarshipCoverage.LIVING_EXPENSES,
        ],
        link: 'https://updated-link.com',
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/scholarships/${scholarshipId}`)
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('id', scholarshipId);
      expect(response.body).toHaveProperty(
        'description',
        'Updated description',
      );
      expect(response.body).toHaveProperty(
        'eligibility',
        'Updated eligibility criteria',
      );
      expect(response.body).toHaveProperty('link', 'https://updated-link.com');
      expect(response.body.coverage).toContain(ScholarshipCoverage.TUITION);
      expect(response.body.coverage).toContain(
        ScholarshipCoverage.LIVING_EXPENSES,
      );
    });

    it('should fail to update scholarship by non-owner', async () => {
      const anotherAdvisor = await testHelper.createTestUser({
        name: 'Another Advisor',
        email: 'another@test.com',
        type: UserType.ADVISOR,
      });

      const updateData = {
        description: 'Unauthorized update',
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/scholarships/${scholarshipId}`)
        .set(testHelper.getAuthHeader(anotherAdvisor.token!))
        .send(updateData)
        .expect(403);

      expect(response.body.message).toContain('not authorized');
    });

    it('should fail without authentication', async () => {
      const updateData = {
        description: 'Unauthorized update',
      };

      await request(app.getHttpServer())
        .patch(`/api/scholarships/${scholarshipId}`)
        .send(updateData)
        .expect(401);
    });

    it('should validate update data', async () => {
      const invalidUpdateData = {
        type: 'INVALID_TYPE',
        coverage: ['INVALID_COVERAGE'],
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/scholarships/${scholarshipId}`)
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send(invalidUpdateData)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
    });
  });

  describe('DELETE /api/scholarships/:id', () => {
    let scholarshipId: string;

    beforeEach(async () => {
      const scholarshipData = {
        name: 'Scholarship to Delete',
        provider: 'Test Provider',
        type: ScholarshipType.PARTIAL,
        deadline: '2024-12-31',
        description: 'To be deleted',
        eligibility: 'Test eligibility',
        coverage: [ScholarshipCoverage.TUITION],
        universityId: testUniversity.id,
      };

      const response = await request(app.getHttpServer())
        .post('/api/scholarships')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send(scholarshipData)
        .expect(201);

      scholarshipId = response.body.id;
    });

    it('should delete scholarship successfully by owner', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/scholarships/${scholarshipId}`)
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted');

      // Verify scholarship is actually deleted
      await request(app.getHttpServer())
        .get(`/api/scholarships/${scholarshipId}`)
        .expect(404);
    });

    it('should fail to delete scholarship by non-owner', async () => {
      const anotherAdvisor = await testHelper.createTestUser({
        name: 'Another Advisor',
        email: 'another@test.com',
        type: UserType.ADVISOR,
      });

      const response = await request(app.getHttpServer())
        .delete(`/api/scholarships/${scholarshipId}`)
        .set(testHelper.getAuthHeader(anotherAdvisor.token!))
        .expect(403);

      expect(response.body.message).toContain('not authorized');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/api/scholarships/${scholarshipId}`)
        .expect(401);
    });

    it('should fail to delete non-existent scholarship', async () => {
      const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app.getHttpServer())
        .delete(`/api/scholarships/${fakeUuid}`)
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /api/scholarships/advisor/me', () => {
    beforeEach(async () => {
      // Create scholarships for the advisor
      const scholarship1Data = {
        name: 'My First Scholarship',
        provider: 'My Provider',
        type: ScholarshipType.FULL,
        deadline: '2024-12-31',
        description: 'My scholarship 1',
        eligibility: 'Eligibility 1',
        coverage: [ScholarshipCoverage.TUITION],
        universityId: testUniversity.id,
      };

      const scholarship2Data = {
        name: 'My Second Scholarship',
        provider: 'My Provider',
        type: ScholarshipType.PARTIAL,
        deadline: '2024-11-30',
        description: 'My scholarship 2',
        eligibility: 'Eligibility 2',
        coverage: [ScholarshipCoverage.TUITION],
        universityId: testUniversity.id,
      };

      await request(app.getHttpServer())
        .post('/api/scholarships')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send(scholarship1Data)
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/scholarships')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send(scholarship2Data)
        .expect(201);
    });

    it('should get advisor scholarships', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/scholarships/advisor/me')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(2);

      const scholarshipNames = response.body.map((s: any) => s.name);
      expect(scholarshipNames).toContain('My First Scholarship');
      expect(scholarshipNames).toContain('My Second Scholarship');

      // All scholarships should belong to the advisor
      response.body.forEach((scholarship: any) => {
        expect(scholarship).toHaveProperty('advisorId', advisorUser.id);
      });
    });

    it('should return empty array for advisor with no scholarships', async () => {
      const anotherAdvisor = await testHelper.createTestUser({
        name: 'Another Advisor',
        email: 'empty@test.com',
        type: UserType.ADVISOR,
      });
      await testHelper.createAdvisorProfile(anotherAdvisor.id);

      const response = await request(app.getHttpServer())
        .get('/api/scholarships/advisor/me')
        .set(testHelper.getAuthHeader(anotherAdvisor.token!))
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(0);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/scholarships/advisor/me')
        .expect(401);
    });

    it('should fail for non-advisor user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/scholarships/advisor/me')
        .set(testHelper.getAuthHeader(studentUser.token!))
        .expect(403);

      expect(response.body.message).toContain('Only advisors');
    });
  });

  describe('Scholarship Validation', () => {
    it('should validate required fields', async () => {
      const invalidData = {
        // Missing required fields
      };

      const response = await request(app.getHttpServer())
        .post('/api/scholarships')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(
        response.body.message.some((msg: string) => msg.includes('name')),
      ).toBe(true);
      expect(
        response.body.message.some((msg: string) => msg.includes('provider')),
      ).toBe(true);
      expect(
        response.body.message.some((msg: string) => msg.includes('type')),
      ).toBe(true);
    });

    it('should validate scholarship type enum', async () => {
      const invalidData = {
        name: 'Test Scholarship',
        provider: 'Test Provider',
        type: 'INVALID_TYPE',
        deadline: '2024-12-31',
        description: 'Test Description',
        eligibility: 'Test Eligibility',
        universityId: testUniversity.id,
      };

      const response = await request(app.getHttpServer())
        .post('/api/scholarships')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(
        response.body.message.some((msg: string) => msg.includes('type')),
      ).toBe(true);
    });

    it('should validate coverage array', async () => {
      const invalidData = {
        name: 'Test Scholarship',
        provider: 'Test Provider',
        type: ScholarshipType.FULL,
        deadline: '2024-12-31',
        description: 'Test Description',
        eligibility: 'Test Eligibility',
        coverage: ['INVALID_COVERAGE'],
        universityId: testUniversity.id,
      };

      const response = await request(app.getHttpServer())
        .post('/api/scholarships')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(
        response.body.message.some((msg: string) => msg.includes('coverage')),
      ).toBe(true);
    });

    it('should validate date format for deadline', async () => {
      const invalidData = {
        name: 'Test Scholarship',
        provider: 'Test Provider',
        type: ScholarshipType.FULL,
        deadline: 'invalid-date',
        description: 'Test Description',
        eligibility: 'Test Eligibility',
        coverage: [ScholarshipCoverage.TUITION],
        universityId: testUniversity.id,
      };

      const response = await request(app.getHttpServer())
        .post('/api/scholarships')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(
        response.body.message.some((msg: string) => msg.includes('deadline')),
      ).toBe(true);
    });

    it('should validate URL format for link', async () => {
      const invalidData = {
        name: 'Test Scholarship',
        provider: 'Test Provider',
        type: ScholarshipType.FULL,
        deadline: '2024-12-31',
        description: 'Test Description',
        eligibility: 'Test Eligibility',
        coverage: [ScholarshipCoverage.TUITION],
        link: 'invalid-url',
        universityId: testUniversity.id,
      };

      const response = await request(app.getHttpServer())
        .post('/api/scholarships')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(
        response.body.message.some((msg: string) => msg.includes('link')),
      ).toBe(true);
    });
  });
});
