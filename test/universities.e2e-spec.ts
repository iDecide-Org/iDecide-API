import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { UniversitiesModule } from '../src/universities/universities.module';
import { IntegrationTestSetup } from './integration-setup';
import { UserType } from '../src/auth/users/user.entity';
import { UniversityType } from '../src/universities/university.entity';

describe('Universities Integration Tests', () => {
  const setup = new IntegrationTestSetup();
  let advisorToken: string;
  let studentToken: string;

  beforeAll(async () => {
    await setup.setupTestApp(UniversitiesModule);
  });

  afterAll(async () => {
    await setup.closeApp();
  });

  beforeEach(async () => {
    await setup.clearDatabase();

    // Create advisor user
    await request(setup.app.getHttpServer()).post('/auth/signup').send({
      name: 'Advisor User',
      email: 'advisor@university.edu',
      password: 'SecurePass123!',
      type: UserType.ADVISOR,
    });

    const advisorSignin = await request(setup.app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'advisor@university.edu',
        password: 'SecurePass123!',
      });

    advisorToken = advisorSignin.headers['set-cookie'][0]
      .split('jwt=')[1]
      .split(';')[0];

    // Create student user
    await request(setup.app.getHttpServer()).post('/auth/signup').send({
      name: 'Student User',
      email: 'student@example.com',
      password: 'SecurePass123!',
      type: UserType.STUDENT,
    });

    const studentSignin = await request(setup.app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'student@example.com',
        password: 'SecurePass123!',
      });

    studentToken = studentSignin.headers['set-cookie'][0]
      .split('jwt=')[1]
      .split(';')[0];
  });

  describe('/universities (POST)', () => {
    it('should create university as advisor', async () => {
      const universityData = {
        name: 'Test University',
        type: UniversityType.GOVERNMENTAL,
        location: 'Test City',
        description: 'A test university',
        establishment: '2000',
        collegesCount: '5',
        majorsCount: '25',
        website: 'https://test-university.edu',
        phone: '+1234567890',
        email: 'info@test-university.edu',
      };

      const response = await request(setup.app.getHttpServer())
        .post('/universities')
        .set('Cookie', `jwt=${advisorToken}`)
        .send(universityData)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('name', 'Test University');
      expect(response.body).toHaveProperty('type', UniversityType.GOVERNMENTAL);
      expect(response.body).toHaveProperty('establishment', 2000);
    });

    it('should fail to create university as student', async () => {
      const universityData = {
        name: 'Unauthorized University',
        type: UniversityType.PRIVATE,
        location: 'Test City',
        description: 'Should not be created',
        establishment: '2000',
        collegesCount: '5',
        majorsCount: '25',
        website: 'https://unauthorized.edu',
        phone: '+1234567890',
        email: 'info@unauthorized.edu',
      };

      await request(setup.app.getHttpServer())
        .post('/universities')
        .set('Cookie', `jwt=${studentToken}`)
        .send(universityData)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail with invalid data', async () => {
      const invalidData = {
        name: 'A', // Too short
        type: 'INVALID_TYPE',
        location: '',
      };

      await request(setup.app.getHttpServer())
        .post('/universities')
        .set('Cookie', `jwt=${advisorToken}`)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/universities (GET)', () => {
    beforeEach(async () => {
      // Create a test university
      await request(setup.app.getHttpServer())
        .post('/universities')
        .set('Cookie', `jwt=${advisorToken}`)
        .send({
          name: 'Get Test University',
          type: UniversityType.GOVERNMENTAL,
          location: 'Test City',
          description: 'A test university for GET requests',
          establishment: '1990',
          collegesCount: '8',
          majorsCount: '40',
          website: 'https://get-test.edu',
          phone: '+1234567890',
          email: 'info@get-test.edu',
        });
    });

    it('should return all universities', async () => {
      const response = await request(setup.app.getHttpServer())
        .get('/universities')
        .expect(HttpStatus.OK);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('name', 'Get Test University');
    });

    it('should return university by ID', async () => {
      // First get all universities to get an ID
      const universitiesResponse = await request(setup.app.getHttpServer()).get(
        '/universities',
      );

      const universityId = universitiesResponse.body[0].id;

      const response = await request(setup.app.getHttpServer())
        .get(`/universities/${universityId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', universityId);
      expect(response.body).toHaveProperty('name', 'Get Test University');
    });

    it('should return 404 for non-existent university', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      await request(setup.app.getHttpServer())
        .get(`/universities/${fakeId}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('/universities/:id (PUT)', () => {
    let universityId: string;

    beforeEach(async () => {
      // Create a university to update
      const createResponse = await request(setup.app.getHttpServer())
        .post('/universities')
        .set('Cookie', `jwt=${advisorToken}`)
        .send({
          name: 'Update Test University',
          type: UniversityType.PRIVATE,
          location: 'Update City',
          description: 'A university to be updated',
          establishment: '1995',
          collegesCount: '6',
          majorsCount: '30',
          website: 'https://update-test.edu',
          phone: '+1234567890',
          email: 'info@update-test.edu',
        });

      universityId = createResponse.body.id;
    });

    it('should update university as owner advisor', async () => {
      const updateData = {
        name: 'Updated University Name',
        description: 'Updated description',
      };

      const response = await request(setup.app.getHttpServer())
        .put(`/universities/${universityId}`)
        .set('Cookie', `jwt=${advisorToken}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('name', 'Updated University Name');
      expect(response.body).toHaveProperty(
        'description',
        'Updated description',
      );
    });

    it('should fail to update as student', async () => {
      const updateData = {
        name: 'Unauthorized Update',
        description: 'Should not work',
      };

      await request(setup.app.getHttpServer())
        .put(`/universities/${universityId}`)
        .set('Cookie', `jwt=${studentToken}`)
        .send(updateData)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/universities/:id (DELETE)', () => {
    let universityId: string;

    beforeEach(async () => {
      // Create a university to delete
      const createResponse = await request(setup.app.getHttpServer())
        .post('/universities')
        .set('Cookie', `jwt=${advisorToken}`)
        .send({
          name: 'Delete Test University',
          type: UniversityType.GOVERNMENTAL,
          location: 'Delete City',
          description: 'A university to be deleted',
          establishment: '1980',
          collegesCount: '4',
          majorsCount: '20',
          website: 'https://delete-test.edu',
          phone: '+1234567890',
          email: 'info@delete-test.edu',
        });

      universityId = createResponse.body.id;
    });

    it('should delete university as owner advisor', async () => {
      await request(setup.app.getHttpServer())
        .delete(`/universities/${universityId}`)
        .set('Cookie', `jwt=${advisorToken}`)
        .expect(HttpStatus.OK);

      // Verify it's deleted
      await request(setup.app.getHttpServer())
        .get(`/universities/${universityId}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should fail to delete as student', async () => {
      await request(setup.app.getHttpServer())
        .delete(`/universities/${universityId}`)
        .set('Cookie', `jwt=${studentToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
