import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { IntegrationTestSetup } from './integration-setup';
import { AuthModule } from '../src/auth/auth.module';

describe('Auth Integration Tests', () => {
  const setup = new IntegrationTestSetup();
  let app: INestApplication;

  beforeAll(async () => {
    console.log('[Auth E2E] Starting test setup...');
    try {
      app = await setup.setupTestApp(AuthModule);
      console.log('[Auth E2E] Test setup completed');
    } catch (error) {
      console.error('[Auth E2E] Test setup failed:', error);
      throw error;
    }
  }, 60000); // 60 seconds timeout

  afterAll(async () => {
    console.log('[Auth E2E] Cleaning up...');
    try {
      await setup.closeApp();
      console.log('[Auth E2E] Cleanup completed');
    } catch (error) {
      console.error('[Auth E2E] Cleanup failed:', error);
    }
  });

  beforeEach(async () => {
    await setup.clearDatabase();
  });

  describe('/auth/signup (POST)', () => {
    it('should create a new student user', async () => {
      const signupDto = {
        name: 'Test Student',
        email: 'student@test.com',
        password: 'Password123!',
        type: 'student',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupDto)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(signupDto.email);
      expect(response.body.user.type).toBe('student');
    });

    it('should create a new advisor user', async () => {
      const signupDto = {
        name: 'Test Advisor',
        email: 'advisor@test.com',
        password: 'Password123!',
        type: 'advisor',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupDto)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(signupDto.email);
      expect(response.body.user.type).toBe('advisor');
    });

    it('should fail with invalid email format', async () => {
      const signupDto = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'Password123!',
        type: 'student',
      };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupDto)
        .expect(400);
    });

    it('should fail with weak password', async () => {
      const signupDto = {
        name: 'Test User',
        email: 'test@test.com',
        password: '123',
        type: 'student',
      };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupDto)
        .expect(400);
    });

    it('should fail with duplicate email', async () => {
      const signupDto = {
        name: 'Test User',
        email: 'duplicate@test.com',
        password: 'Password123!',
        type: 'student',
      };

      // Create first user
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupDto)
        .expect(201);

      // Try to create duplicate
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupDto)
        .expect(409);
    });
  });

  describe('/auth/signin (POST)', () => {
    beforeEach(async () => {
      // Create a test user for signin tests
      const signupDto = {
        name: 'Test User',
        email: 'signin@test.com',
        password: 'Password123!',
        type: 'student',
      };

      await request(app.getHttpServer()).post('/auth/signup').send(signupDto);
    });

    it('should sign in with valid credentials', async () => {
      const signinDto = {
        email: 'signin@test.com',
        password: 'Password123!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send(signinDto)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(signinDto.email);
    });

    it('should fail with invalid email', async () => {
      const signinDto = {
        email: 'nonexistent@test.com',
        password: 'Password123!',
      };

      await request(app.getHttpServer())
        .post('/auth/signin')
        .send(signinDto)
        .expect(401);
    });

    it('should fail with invalid password', async () => {
      const signinDto = {
        email: 'signin@test.com',
        password: 'WrongPassword!',
      };

      await request(app.getHttpServer())
        .post('/auth/signin')
        .send(signinDto)
        .expect(401);
    });
  });

  // Add more test cases as needed...
});
