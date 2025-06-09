import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { FavoritesModule } from '../src/favorites/favorites.module';
import { IntegrationTestSetup } from './integration-setup';
import { UserType } from '../src/auth/users/user.entity';
import { UniversityType } from '../src/universities/university.entity';
import { ScholarshipType } from '../src/scholarships/scholarship.entity';

describe('Favorites Integration Tests', () => {
  const setup = new IntegrationTestSetup();
  let studentToken: string;
  let advisorToken: string;
  let universityId: string;
  let scholarshipId: string;

  beforeAll(async () => {
    await setup.setupTestApp(FavoritesModule);
  }, 120000); // 2 minute timeout for setup

  afterAll(async () => {
    await setup.closeApp();
  });

  beforeEach(async () => {
    await setup.clearDatabase();

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

    if (
      studentSignin.headers['set-cookie'] &&
      studentSignin.headers['set-cookie'][0]
    ) {
      studentToken = studentSignin.headers['set-cookie'][0]
        .split('jwt=')[1]
        .split(';')[0];
    } else {
      throw new Error('Failed to get student authentication token');
    }

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

    if (
      advisorSignin.headers['set-cookie'] &&
      advisorSignin.headers['set-cookie'][0]
    ) {
      advisorToken = advisorSignin.headers['set-cookie'][0]
        .split('jwt=')[1]
        .split(';')[0];
    } else {
      throw new Error('Failed to get advisor authentication token');
    }

    // Create a university
    const universityResponse = await request(setup.app.getHttpServer())
      .post('/universities')
      .set('Cookie', `jwt=${advisorToken}`)
      .send({
        name: 'Favorite Test University',
        type: UniversityType.GOVERNMENTAL,
        location: 'Test City',
        description: 'A university for favorites testing',
        establishment: '2000',
        collegesCount: '5',
        majorsCount: '25',
        website: 'https://favorite-test.edu',
        phone: '+1234567890',
        email: 'info@favorite-test.edu',
      });

    universityId = universityResponse.body.id;

    // Create a scholarship
    const scholarshipResponse = await request(setup.app.getHttpServer())
      .post('/scholarships')
      .set('Cookie', `jwt=${advisorToken}`)
      .send({
        name: 'Favorite Test Scholarship',
        provider: 'Test Foundation',
        type: ScholarshipType.FULL,
        amount: 5000,
        deadline: '2024-12-31',
        description: 'A scholarship for favorites testing',
        eligibility: 'GPA > 3.5',
        requirements: 'Transcript',
        applicationProcess: 'Online',
        contactInfo: 'scholarships@test.org',
        website: 'https://scholarships.test.org',
        coverage: ['TUITION'],
        universityId: universityId,
      });

    scholarshipId = scholarshipResponse.body.id;
  });

  describe('/favorites/universities (GET)', () => {
    it('should return empty favorites initially', async () => {
      const response = await request(setup.app.getHttpServer())
        .get('/favorites/universities')
        .set('Cookie', `jwt=${studentToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(0);
    });

    it('should fail without authentication', async () => {
      await request(setup.app.getHttpServer())
        .get('/favorites/universities')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/favorites/universities/:id (POST)', () => {
    it('should add university to favorites', async () => {
      const response = await request(setup.app.getHttpServer())
        .post(`/favorites/universities/${universityId}`)
        .set('Cookie', `jwt=${studentToken}`)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('universityId', universityId);
      expect(response.body).toHaveProperty('university');
      expect(response.body.university).toHaveProperty(
        'name',
        'Favorite Test University',
      );
    });

    it('should fail to add non-existent university', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      await request(setup.app.getHttpServer())
        .post(`/favorites/universities/${fakeId}`)
        .set('Cookie', `jwt=${studentToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should handle duplicate favorites gracefully', async () => {
      // Add to favorites first time
      await request(setup.app.getHttpServer())
        .post(`/favorites/universities/${universityId}`)
        .set('Cookie', `jwt=${studentToken}`)
        .expect(HttpStatus.CREATED);

      // Try to add again
      await request(setup.app.getHttpServer())
        .post(`/favorites/universities/${universityId}`)
        .set('Cookie', `jwt=${studentToken}`)
        .expect(HttpStatus.CONFLICT);
    });
  });

  describe('/favorites/universities/:id (DELETE)', () => {
    beforeEach(async () => {
      // Add university to favorites first
      await request(setup.app.getHttpServer())
        .post(`/favorites/universities/${universityId}`)
        .set('Cookie', `jwt=${studentToken}`);
    });

    it('should remove university from favorites', async () => {
      await request(setup.app.getHttpServer())
        .delete(`/favorites/universities/${universityId}`)
        .set('Cookie', `jwt=${studentToken}`)
        .expect(HttpStatus.OK);

      // Verify it's removed
      const response = await request(setup.app.getHttpServer())
        .get('/favorites/universities')
        .set('Cookie', `jwt=${studentToken}`);

      expect(response.body).toHaveLength(0);
    });

    it('should handle removing non-favorite university', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      await request(setup.app.getHttpServer())
        .delete(`/favorites/universities/${fakeId}`)
        .set('Cookie', `jwt=${studentToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('/favorites/universities/:id/check (GET)', () => {
    it('should return false for non-favorite university', async () => {
      const response = await request(setup.app.getHttpServer())
        .get(`/favorites/universities/${universityId}/check`)
        .set('Cookie', `jwt=${studentToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('isFavorite', false);
    });

    it('should return true for favorite university', async () => {
      // Add to favorites first
      await request(setup.app.getHttpServer())
        .post(`/favorites/universities/${universityId}`)
        .set('Cookie', `jwt=${studentToken}`);

      const response = await request(setup.app.getHttpServer())
        .get(`/favorites/universities/${universityId}/check`)
        .set('Cookie', `jwt=${studentToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('isFavorite', true);
    });
  });

  describe('Scholarship Favorites', () => {
    describe('/favorites/scholarships (GET)', () => {
      it('should return empty scholarship favorites initially', async () => {
        const response = await request(setup.app.getHttpServer())
          .get('/favorites/scholarships')
          .set('Cookie', `jwt=${studentToken}`)
          .expect(HttpStatus.OK);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body).toHaveLength(0);
      });
    });

    describe('/favorites/scholarships/:id (POST)', () => {
      it('should add scholarship to favorites', async () => {
        const response = await request(setup.app.getHttpServer())
          .post(`/favorites/scholarships/${scholarshipId}`)
          .set('Cookie', `jwt=${studentToken}`)
          .expect(HttpStatus.CREATED);

        expect(response.body).toHaveProperty('scholarshipId', scholarshipId);
        expect(response.body).toHaveProperty('scholarship');
        expect(response.body.scholarship).toHaveProperty(
          'name',
          'Favorite Test Scholarship',
        );
      });

      it('should fail to add non-existent scholarship', async () => {
        const fakeId = '123e4567-e89b-12d3-a456-426614174000';

        await request(setup.app.getHttpServer())
          .post(`/favorites/scholarships/${fakeId}`)
          .set('Cookie', `jwt=${studentToken}`)
          .expect(HttpStatus.NOT_FOUND);
      });
    });

    describe('/favorites/scholarships/:id (DELETE)', () => {
      beforeEach(async () => {
        // Add scholarship to favorites first
        await request(setup.app.getHttpServer())
          .post(`/favorites/scholarships/${scholarshipId}`)
          .set('Cookie', `jwt=${studentToken}`);
      });

      it('should remove scholarship from favorites', async () => {
        await request(setup.app.getHttpServer())
          .delete(`/favorites/scholarships/${scholarshipId}`)
          .set('Cookie', `jwt=${studentToken}`)
          .expect(HttpStatus.OK);

        // Verify it's removed
        const response = await request(setup.app.getHttpServer())
          .get('/favorites/scholarships')
          .set('Cookie', `jwt=${studentToken}`);

        expect(response.body).toHaveLength(0);
      });
    });
  });

  describe('Integration with other modules', () => {
    it('should maintain favorites when university is updated', async () => {
      // Add university to favorites
      await request(setup.app.getHttpServer())
        .post(`/favorites/universities/${universityId}`)
        .set('Cookie', `jwt=${studentToken}`);

      // Update university
      await request(setup.app.getHttpServer())
        .put(`/universities/${universityId}`)
        .set('Cookie', `jwt=${advisorToken}`)
        .send({
          name: 'Updated Favorite University',
          description: 'Updated description',
        });

      // Check favorites still exist
      const response = await request(setup.app.getHttpServer())
        .get('/favorites/universities')
        .set('Cookie', `jwt=${studentToken}`);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].university).toHaveProperty(
        'name',
        'Updated Favorite University',
      );
    });

    it('should remove favorites when university is deleted', async () => {
      // Add university to favorites
      await request(setup.app.getHttpServer())
        .post(`/favorites/universities/${universityId}`)
        .set('Cookie', `jwt=${studentToken}`);

      // Delete university
      await request(setup.app.getHttpServer())
        .delete(`/universities/${universityId}`)
        .set('Cookie', `jwt=${advisorToken}`);

      // Check favorites are removed
      const response = await request(setup.app.getHttpServer())
        .get('/favorites/universities')
        .set('Cookie', `jwt=${studentToken}`);

      expect(response.body).toHaveLength(0);
    });
  });
});
