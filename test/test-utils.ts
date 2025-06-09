import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';

// Import entities
import { User, UserType } from '../src/auth/users/user.entity';
import { Student } from '../src/auth/users/student.entity';
import { Advisor } from '../src/auth/users/advisor.entity';
import { Admin } from '../src/auth/users/admin.entity';
import { University } from '../src/universities/university.entity';
import { College } from '../src/colleges/entities/college.entity';
import { Major } from '../src/majors/entities/major.entity';
import { Scholarship } from '../src/scholarships/scholarship.entity';
import { FavoriteUniversity } from '../src/favorites/favorite-university.entity';
import { FavoriteScholarship } from '../src/favorites/favorite-scholarship.entity';
import { Message } from '../src/chat/message.entity';

// Import modules
import { AppModule } from '../src/app.module';
// Import enums
import { CertificateType } from '../src/auth/users/student.entity';
import { UniversityType } from '../src/universities/university.entity';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  type: UserType;
  token?: string;
}

export class TestHelper {
  private app: INestApplication;
  private dataSource: DataSource;
  private jwtService: JwtService;

  async setupTestApp(): Promise<INestApplication> {
    console.log('[TestHelper] Setting up test app...');

    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.test',
          }),
          TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
              type: 'postgres',
              host: configService.get('DB_HOST', 'localhost'),
              port: parseInt(configService.get('DB_PORT', '32768'), 10),
              username: configService.get('DB_USERNAME', 'postgres'),
              password: configService.get('DB_PASSWORD', 'postgres'),
              database: configService.get('DB_DATABASE', 'idecide_test'),
              entities: [
                User,
                Student,
                Advisor,
                Admin,
                University,
                College,
                Major,
                Scholarship,
                FavoriteUniversity,
                FavoriteScholarship,
                Message,
              ],
              synchronize: true,
              dropSchema: true,
              logging: false,
              connectTimeoutMS: 60000,
              acquireTimeoutMillis: 60000,
              timeout: 60000,
              extra: {
                connectionTimeoutMillis: 60000,
                idleTimeoutMillis: 60000,
                max: 5,
                statement_timeout: 60000,
                query_timeout: 60000,
              },
            }),
          }),
          AppModule,
        ],
      }).compile();

      this.app = moduleFixture.createNestApplication();

      this.app.use(cookieParser());
      this.app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          transformOptions: {
            enableImplicitConversion: true,
          },
        }),
      );

      await this.app.init();

      this.dataSource = this.app.get(DataSource);
      this.jwtService = this.app.get(JwtService);

      await this.waitForDatabase();

      console.log('[TestHelper] Test app setup completed successfully');
      return this.app;
    } catch (error) {
      console.error('[TestHelper] Error setting up test app:', error);
      throw error;
    }
  }

  private async waitForDatabase(): Promise<void> {
    if (!this.dataSource) return;

    const maxRetries = 10;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        if (this.dataSource.isInitialized) {
          await this.dataSource.query('SELECT 1');
          console.log('[TestHelper] Database connection established');
          return;
        }
        throw new Error('DataSource not initialized');
      } catch (error) {
        retries++;
        console.log(
          `[TestHelper] Database connection attempt ${retries}/${maxRetries} failed:`,
          error.message,
        );

        if (retries >= maxRetries) {
          throw new Error(
            `Failed to connect to database after ${maxRetries} attempts`,
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  async cleanDatabase(): Promise<void> {
    if (!this.dataSource || !this.dataSource.isInitialized) return;

    try {
      // Get all table names
      const tables = await this.dataSource.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
      `);

      if (tables.length === 0) {
        return;
      }

      // Disable triggers temporarily
      await this.dataSource.query('SET session_replication_role = replica;');

      // Clear tables in reverse order to handle foreign key constraints
      for (const table of tables.reverse()) {
        await this.dataSource.query(
          `TRUNCATE TABLE "${table.tablename}" RESTART IDENTITY CASCADE`,
        );
      }

      // Re-enable triggers
      await this.dataSource.query('SET session_replication_role = DEFAULT;');
    } catch (error) {
      console.error('Error cleaning database:', error);
      // Fallback to entity clearing
      try {
        const entities = this.dataSource.entityMetadatas;
        for (const entity of entities.reverse()) {
          const repository = this.dataSource.getRepository(entity.name);
          await repository.clear();
        }
      } catch (fallbackError) {
        console.error('Fallback clean also failed:', fallbackError);
      }
    }
  }

  async closeApp(): Promise<void> {
    if (this.dataSource) {
      await this.dataSource.destroy();
    }
    if (this.app) {
      await this.app.close();
    }
  }

  getApp(): INestApplication {
    return this.app;
  }

  // Helper method to create test users
  async createTestUser(
    userData: Partial<User> & {
      email: string;
      name: string;
      type: UserType;
      password?: string;
    },
  ): Promise<TestUser> {
    const userRepository = this.dataSource.getRepository(User);

    const user = userRepository.create({
      email: userData.email,
      name: userData.name,
      type: userData.type,
      password: userData.password || 'hashedPassword123',
      createdAt: new Date(),
      ...userData,
    });

    const savedUser = await userRepository.save(user);

    // Generate JWT token
    const token = this.jwtService.sign({
      id: savedUser.id,
      email: savedUser.email,
    });

    return {
      id: savedUser.id,
      email: savedUser.email,
      name: savedUser.name,
      type: savedUser.type,
      token,
    };
  }

  // Helper method to create test student profile
  async createStudentProfile(
    userId: string,
    profileData: Partial<Student> = {},
  ): Promise<Student> {
    const studentRepository = this.dataSource.getRepository(Student);
    const userRepository = this.dataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const student = studentRepository.create({
      user,
      certificateType:
        profileData.certificateType || CertificateType.EGYPTIAN_HIGH_SCHOOL,
      StudyDivision: profileData.StudyDivision || 'Science',
      totalScore: profileData.totalScore || 85.5,
      nationality: profileData.nationality || 'Egyptian',
      isStudentCertified: profileData.isStudentCertified || false,
      isAlumni: profileData.isAlumni || false,
      isAlumniCertified: profileData.isAlumniCertified || false,
      chatbotCompleted: profileData.chatbotCompleted || false,
      ...profileData,
    });

    return await studentRepository.save(student);
  }

  // Helper method to create test advisor profile
  async createAdvisorProfile(
    userId: string,
    profileData: Partial<Advisor> = {},
  ): Promise<Advisor> {
    const advisorRepository = this.dataSource.getRepository(Advisor);
    const userRepository = this.dataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const advisor = advisorRepository.create({
      user,
      communationEmail: profileData.communationEmail || user.email,
      communicationNumber: profileData.communicationNumber || '+1234567890',
      identificationPic: profileData.identificationPic || 'test-id.jpg',
      isIdentified: profileData.isIdentified || true,
      ...profileData,
    });

    return await advisorRepository.save(advisor);
  }

  // Helper method to create test university
  async createTestUniversity(
    advisorUserId: string,
    universityData: Partial<University> = {},
  ): Promise<University> {
    const universityRepository = this.dataSource.getRepository(University);
    const userRepository = this.dataSource.getRepository(User);

    const advisor = await userRepository.findOne({
      where: { id: advisorUserId },
    });
    if (!advisor) {
      throw new Error('Advisor not found');
    }

    const university = universityRepository.create({
      name: universityData.name || 'Test University',
      location: universityData.location || 'Test City, Test Country',
      type: universityData.type || UniversityType.GOVERNMENTAL,
      establishment: universityData.establishment || 2000,
      description: universityData.description || 'A test university',
      website: universityData.website || 'https://test-university.edu',
      phone: universityData.phone || '+1234567890',
      email: universityData.email || 'info@test-university.edu',
      image: universityData.image || 'test-logo.jpg',
      collegesCount: universityData.collegesCount || 5,
      majorsCount: universityData.majorsCount || 25,
      advisorId: advisorUserId,
      advisor,
      addedBy: advisor,
      addedById: advisorUserId,
      createdAt: new Date(),
      ...universityData,
    });

    return await universityRepository.save(university);
  }

  // Get authorization header for authenticated requests
  getAuthHeader(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
  }

  // Get cookie string for authenticated requests
  getCookieHeader(token: string): { Cookie: string } {
    return { Cookie: `jwt=${token}` };
  }
}

export const testHelper = new TestHelper();
