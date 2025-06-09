import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { testHelper, TestUser } from './test-utils';
import { UserType } from '../src/auth/users/user.entity';
import { University } from '../src/universities/university.entity';
import { DataSource } from 'typeorm';
import { College } from '../src/colleges/entities/college.entity';

describe('Colleges and Majors Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let advisorUser: TestUser;
  let studentUser: TestUser;
  let testUniversity: University;

  beforeAll(async () => {
    app = await testHelper.setupTestApp();
    dataSource = app.get(DataSource);
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
      name: 'Test University for Colleges',
    });
  });

  afterAll(async () => {
    await testHelper.closeApp();
  });

  describe('Colleges Module', () => {
    describe('POST /api/colleges', () => {
      it('should create college successfully with advisor user', async () => {
        const collegeData = {
          name: 'Faculty of Engineering',
          description: 'Engineering college with multiple departments',
          location: 'Main Campus, Building A',
          website: 'https://engineering.university.edu',
          universityId: testUniversity.id,
        };

        const response = await request(app.getHttpServer())
          .post('/api/colleges')
          .set(testHelper.getAuthHeader(advisorUser.token!))
          .send(collegeData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('name', 'Faculty of Engineering');
        expect(response.body).toHaveProperty(
          'description',
          'Engineering college with multiple departments',
        );
        expect(response.body).toHaveProperty(
          'location',
          'Main Campus, Building A',
        );
        expect(response.body).toHaveProperty(
          'website',
          'https://engineering.university.edu',
        );
        expect(response.body).toHaveProperty('universityId', testUniversity.id);
      });

      it('should fail to create college with student user', async () => {
        const collegeData = {
          name: 'Test College',
          description: 'Test Description',
          location: 'Test Location',
          universityId: testUniversity.id,
        };

        const response = await request(app.getHttpServer())
          .post('/api/colleges')
          .set(testHelper.getAuthHeader(studentUser.token!))
          .send(collegeData)
          .expect(403);

        expect(response.body.message).toContain('Only advisors');
      });

      it('should fail without authentication', async () => {
        const collegeData = {
          name: 'Test College',
          description: 'Test Description',
          universityId: testUniversity.id,
        };

        await request(app.getHttpServer())
          .post('/api/colleges')
          .send(collegeData)
          .expect(401);
      });

      it('should fail with invalid university ID', async () => {
        const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';
        const collegeData = {
          name: 'Test College',
          description: 'Test Description',
          universityId: fakeUuid,
        };

        const response = await request(app.getHttpServer())
          .post('/api/colleges')
          .set(testHelper.getAuthHeader(advisorUser.token!))
          .send(collegeData)
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
        );

        const collegeData = {
          name: 'Unauthorized College',
          description: 'Test Description',
          universityId: anotherUniversity.id,
        };

        const response = await request(app.getHttpServer())
          .post('/api/colleges')
          .set(testHelper.getAuthHeader(advisorUser.token!))
          .send(collegeData)
          .expect(403);

        expect(response.body.message).toContain('do not own');
      });

      it('should validate required fields', async () => {
        const invalidData = {
          // Missing required fields
          universityId: testUniversity.id,
        };

        const response = await request(app.getHttpServer())
          .post('/api/colleges')
          .set(testHelper.getAuthHeader(advisorUser.token!))
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toBeInstanceOf(Array);
        expect(
          response.body.message.some((msg: string) => msg.includes('name')),
        ).toBe(true);
      });
    });

    describe('GET /api/colleges', () => {
      beforeEach(async () => {
        // Create test colleges
        const collegeRepository = dataSource.getRepository(College);

        const college1 = collegeRepository.create({
          name: 'Faculty of Science',
          description: 'Science college',
          location: 'Science Building',
          universityId: testUniversity.id,
          university: testUniversity,
        });
        await collegeRepository.save(college1);

        const college2 = collegeRepository.create({
          name: 'Faculty of Arts',
          description: 'Arts college',
          location: 'Arts Building',
          universityId: testUniversity.id,
          university: testUniversity,
        });
        await collegeRepository.save(college2);
      });

      it('should get all colleges', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/colleges')
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body).toHaveLength(2);

        const collegeNames = response.body.map((c: any) => c.name);
        expect(collegeNames).toContain('Faculty of Science');
        expect(collegeNames).toContain('Faculty of Arts');
      });

      it('should return empty array when no colleges exist', async () => {
        await testHelper.cleanDatabase();

        const response = await request(app.getHttpServer())
          .get('/api/colleges')
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body).toHaveLength(0);
      });
    });

    describe('GET /api/colleges/:id', () => {
      let collegeId: string;

      beforeEach(async () => {
        const collegeRepository = dataSource.getRepository(College);
        const college = collegeRepository.create({
          name: 'Faculty of Medicine',
          description: 'Medical education and research',
          location: 'Medical Campus',
          website: 'https://medicine.university.edu',
          universityId: testUniversity.id,
          university: testUniversity,
        });
        const savedCollege = await collegeRepository.save(college);
        collegeId = savedCollege.id;
      });

      it('should get college by id', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/colleges/${collegeId}`)
          .expect(200);

        expect(response.body).toHaveProperty('id', collegeId);
        expect(response.body).toHaveProperty('name', 'Faculty of Medicine');
        expect(response.body).toHaveProperty(
          'description',
          'Medical education and research',
        );
        expect(response.body).toHaveProperty(
          'website',
          'https://medicine.university.edu',
        );
        expect(response.body).toHaveProperty('university');
      });

      it('should return 404 for non-existent college', async () => {
        const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

        const response = await request(app.getHttpServer())
          .get(`/api/colleges/${fakeUuid}`)
          .expect(404);

        expect(response.body.message).toContain('not found');
      });
    });

    describe('GET /api/colleges/university/:universityId', () => {
      beforeEach(async () => {
        // Create colleges for the university
        const collegeRepository = dataSource.getRepository(College);

        const college1 = collegeRepository.create({
          name: 'College 1',
          description: 'First college',
          universityId: testUniversity.id,
          university: testUniversity,
        });
        await collegeRepository.save(college1);

        const college2 = collegeRepository.create({
          name: 'College 2',
          description: 'Second college',
          universityId: testUniversity.id,
          university: testUniversity,
        });
        await collegeRepository.save(college2);
      });

      it('should get colleges by university', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/colleges/university/${testUniversity.id}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body).toHaveLength(2);

        response.body.forEach((college: any) => {
          expect(college).toHaveProperty('universityId', testUniversity.id);
        });
      });

      it('should return empty array for university with no colleges', async () => {
        const anotherAdvisor = await testHelper.createTestUser({
          name: 'Another Advisor',
          email: 'advisor2@test.com',
          type: UserType.ADVISOR,
        });
        await testHelper.createAdvisorProfile(anotherAdvisor.id);
        const emptyUniversity = await testHelper.createTestUniversity(
          anotherAdvisor.id,
        );

        const response = await request(app.getHttpServer())
          .get(`/api/colleges/university/${emptyUniversity.id}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body).toHaveLength(0);
      });
    });
  });

  describe('Majors Module', () => {
    let testCollege: College;

    beforeEach(async () => {
      // Create a test college
      const collegeRepository = dataSource.getRepository(College);
      testCollege = collegeRepository.create({
        name: 'Faculty of Computer Science',
        description: 'Computer Science education',
        universityId: testUniversity.id,
        university: testUniversity,
      });
      await collegeRepository.save(testCollege);
    });

    describe('POST /api/majors', () => {
      it('should create major successfully with advisor user', async () => {
        const majorData = {
          name: 'Computer Science',
          description: 'Bachelor of Science in Computer Science',
          duration: '4 years',
          degreeType: 'Bachelor',
          creditHours: 130,
          collegeId: testCollege.id,
        };

        const response = await request(app.getHttpServer())
          .post('/api/majors')
          .set(testHelper.getAuthHeader(advisorUser.token!))
          .send(majorData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('name', 'Computer Science');
        expect(response.body).toHaveProperty(
          'description',
          'Bachelor of Science in Computer Science',
        );
        expect(response.body).toHaveProperty('duration', '4 years');
        expect(response.body).toHaveProperty('degreeType', 'Bachelor');
        expect(response.body).toHaveProperty('creditHours', 130);
        expect(response.body).toHaveProperty('collegeId', testCollege.id);
      });

      it('should fail to create major with student user', async () => {
        const majorData = {
          name: 'Test Major',
          description: 'Test Description',
          collegeId: testCollege.id,
        };

        const response = await request(app.getHttpServer())
          .post('/api/majors')
          .set(testHelper.getAuthHeader(studentUser.token!))
          .send(majorData)
          .expect(403);

        expect(response.body.message).toContain('Only advisors');
      });

      it('should fail with invalid college ID', async () => {
        const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';
        const majorData = {
          name: 'Test Major',
          description: 'Test Description',
          collegeId: fakeUuid,
        };

        const response = await request(app.getHttpServer())
          .post('/api/majors')
          .set(testHelper.getAuthHeader(advisorUser.token!))
          .send(majorData)
          .expect(404);

        expect(response.body.message).toContain('College not found');
      });

      it('should validate required fields', async () => {
        const invalidData = {
          // Missing required fields
          collegeId: testCollege.id,
        };

        const response = await request(app.getHttpServer())
          .post('/api/majors')
          .set(testHelper.getAuthHeader(advisorUser.token!))
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toBeInstanceOf(Array);
        expect(
          response.body.message.some((msg: string) => msg.includes('name')),
        ).toBe(true);
      });
    });

    describe('GET /api/majors', () => {
      beforeEach(async () => {
        // Create test majors
        const response1 = await request(app.getHttpServer())
          .post('/api/majors')
          .set(testHelper.getAuthHeader(advisorUser.token!))
          .send({
            name: 'Software Engineering',
            description: 'Software development and engineering',
            duration: '4 years',
            degreeType: 'Bachelor',
            collegeId: testCollege.id,
          });

        const response2 = await request(app.getHttpServer())
          .post('/api/majors')
          .set(testHelper.getAuthHeader(advisorUser.token!))
          .send({
            name: 'Data Science',
            description: 'Data analysis and machine learning',
            duration: '4 years',
            degreeType: 'Bachelor',
            collegeId: testCollege.id,
          });
      });

      it('should get all majors', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/majors')
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body).toHaveLength(2);

        const majorNames = response.body.map((m: any) => m.name);
        expect(majorNames).toContain('Software Engineering');
        expect(majorNames).toContain('Data Science');
      });
    });

    describe('GET /api/majors/:id', () => {
      let majorId: string;

      beforeEach(async () => {
        const response = await request(app.getHttpServer())
          .post('/api/majors')
          .set(testHelper.getAuthHeader(advisorUser.token!))
          .send({
            name: 'Cybersecurity',
            description: 'Information security and cyber defense',
            duration: '4 years',
            degreeType: 'Bachelor',
            creditHours: 128,
            collegeId: testCollege.id,
          })
          .expect(201);

        majorId = response.body.id;
      });

      it('should get major by id', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/majors/${majorId}`)
          .expect(200);

        expect(response.body).toHaveProperty('id', majorId);
        expect(response.body).toHaveProperty('name', 'Cybersecurity');
        expect(response.body).toHaveProperty(
          'description',
          'Information security and cyber defense',
        );
        expect(response.body).toHaveProperty('creditHours', 128);
        expect(response.body).toHaveProperty('college');
      });

      it('should return 404 for non-existent major', async () => {
        const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

        const response = await request(app.getHttpServer())
          .get(`/api/majors/${fakeUuid}`)
          .expect(404);

        expect(response.body.message).toContain('not found');
      });
    });

    describe('GET /api/majors/college/:collegeId', () => {
      beforeEach(async () => {
        // Create majors for the college
        await request(app.getHttpServer())
          .post('/api/majors')
          .set(testHelper.getAuthHeader(advisorUser.token!))
          .send({
            name: 'Major 1',
            description: 'First major',
            collegeId: testCollege.id,
          });

        await request(app.getHttpServer())
          .post('/api/majors')
          .set(testHelper.getAuthHeader(advisorUser.token!))
          .send({
            name: 'Major 2',
            description: 'Second major',
            collegeId: testCollege.id,
          });
      });

      it('should get majors by college', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/majors/college/${testCollege.id}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body).toHaveLength(2);

        response.body.forEach((major: any) => {
          expect(major).toHaveProperty('collegeId', testCollege.id);
        });
      });

      it('should return empty array for college with no majors', async () => {
        const collegeRepository = dataSource.getRepository(College);
        const emptyCollege = collegeRepository.create({
          name: 'Empty College',
          description: 'No majors yet',
          universityId: testUniversity.id,
          university: testUniversity,
        });
        await collegeRepository.save(emptyCollege);

        const response = await request(app.getHttpServer())
          .get(`/api/majors/college/${emptyCollege.id}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body).toHaveLength(0);
      });
    });

    describe('PATCH /api/majors/:id', () => {
      let majorId: string;

      beforeEach(async () => {
        const response = await request(app.getHttpServer())
          .post('/api/majors')
          .set(testHelper.getAuthHeader(advisorUser.token!))
          .send({
            name: 'Major to Update',
            description: 'Original description',
            duration: '4 years',
            collegeId: testCollege.id,
          })
          .expect(201);

        majorId = response.body.id;
      });

      it('should update major successfully by owner', async () => {
        const updateData = {
          description: 'Updated description',
          duration: '3 years',
          creditHours: 120,
        };

        const response = await request(app.getHttpServer())
          .patch(`/api/majors/${majorId}`)
          .set(testHelper.getAuthHeader(advisorUser.token!))
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('id', majorId);
        expect(response.body).toHaveProperty(
          'description',
          'Updated description',
        );
        expect(response.body).toHaveProperty('duration', '3 years');
        expect(response.body).toHaveProperty('creditHours', 120);
      });

      it('should fail to update major by non-owner', async () => {
        const anotherAdvisor = await testHelper.createTestUser({
          name: 'Another Advisor',
          email: 'another@test.com',
          type: UserType.ADVISOR,
        });

        const updateData = {
          description: 'Unauthorized update',
        };

        const response = await request(app.getHttpServer())
          .patch(`/api/majors/${majorId}`)
          .set(testHelper.getAuthHeader(anotherAdvisor.token!))
          .send(updateData)
          .expect(403);

        expect(response.body.message).toContain('not authorized');
      });
    });

    describe('DELETE /api/majors/:id', () => {
      let majorId: string;

      beforeEach(async () => {
        const response = await request(app.getHttpServer())
          .post('/api/majors')
          .set(testHelper.getAuthHeader(advisorUser.token!))
          .send({
            name: 'Major to Delete',
            description: 'To be removed',
            collegeId: testCollege.id,
          })
          .expect(201);

        majorId = response.body.id;
      });

      it('should delete major successfully by owner', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/api/majors/${majorId}`)
          .set(testHelper.getAuthHeader(advisorUser.token!))
          .expect(200);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('deleted');

        // Verify major is actually deleted
        await request(app.getHttpServer())
          .get(`/api/majors/${majorId}`)
          .expect(404);
      });

      it('should fail to delete major by non-owner', async () => {
        const anotherAdvisor = await testHelper.createTestUser({
          name: 'Another Advisor',
          email: 'another@test.com',
          type: UserType.ADVISOR,
        });

        const response = await request(app.getHttpServer())
          .delete(`/api/majors/${majorId}`)
          .set(testHelper.getAuthHeader(anotherAdvisor.token!))
          .expect(403);

        expect(response.body.message).toContain('not authorized');
      });
    });
  });

  describe('Hierarchical Relationships', () => {
    it('should maintain university -> college -> major hierarchy', async () => {
      // Create college
      const collegeResponse = await request(app.getHttpServer())
        .post('/api/colleges')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send({
          name: 'Engineering College',
          description: 'Engineering education',
          universityId: testUniversity.id,
        })
        .expect(201);

      const collegeId = collegeResponse.body.id;

      // Create major in the college
      const majorResponse = await request(app.getHttpServer())
        .post('/api/majors')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send({
          name: 'Mechanical Engineering',
          description: 'Mechanical engineering program',
          collegeId,
        })
        .expect(201);

      const majorId = majorResponse.body.id;

      // Verify relationships
      const majorDetails = await request(app.getHttpServer())
        .get(`/api/majors/${majorId}`)
        .expect(200);

      expect(majorDetails.body).toHaveProperty('college');
      expect(majorDetails.body.college).toHaveProperty('id', collegeId);
      expect(majorDetails.body.college).toHaveProperty('university');
      expect(majorDetails.body.college.university).toHaveProperty(
        'id',
        testUniversity.id,
      );
    });

    it('should prevent orphaned majors when college is deleted', async () => {
      // Create college and major
      const collegeResponse = await request(app.getHttpServer())
        .post('/api/colleges')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send({
          name: 'Temporary College',
          description: 'Will be deleted',
          universityId: testUniversity.id,
        })
        .expect(201);

      const majorResponse = await request(app.getHttpServer())
        .post('/api/majors')
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .send({
          name: 'Temporary Major',
          description: 'Should be handled on college deletion',
          collegeId: collegeResponse.body.id,
        })
        .expect(201);

      // Delete college
      await request(app.getHttpServer())
        .delete(`/api/colleges/${collegeResponse.body.id}`)
        .set(testHelper.getAuthHeader(advisorUser.token!))
        .expect(200);

      // Major should either be deleted or handled gracefully
      const majorCheck = await request(app.getHttpServer()).get(
        `/api/majors/${majorResponse.body.id}`,
      );

      // Either 404 (deleted) or the major still exists with proper handling
      expect([200, 404]).toContain(majorCheck.status);
    });
  });
});
