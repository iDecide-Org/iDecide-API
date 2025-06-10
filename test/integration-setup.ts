import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import * as cookieParser from 'cookie-parser';

// Import all entities
import { User } from '../src/auth/users/user.entity';
import { Student } from '../src/auth/users/student.entity';
import { Advisor } from '../src/auth/users/advisor.entity';
import { Admin } from '../src/auth/users/admin.entity';
import { University } from '../src/universities/university.entity';
import { College } from '../src/colleges/entities/college.entity';
import { Major } from '../src/majors/entities/major.entity';
import { Scholarship } from '../src/scholarships/scholarship.entity';
import { Message } from '../src/chat/message.entity';
import { FavoriteUniversity } from '../src/favorites/favorite-university.entity';
import { FavoriteScholarship } from '../src/favorites/favorite-scholarship.entity';

export class IntegrationTestSetup {
  public app: INestApplication;
  public dataSource: DataSource;
  private moduleRef: TestingModule;

  async setupTestApp(moduleToTest: any): Promise<INestApplication> {
    console.log('[IntegrationTestSetup] Setting up test app...');

    try {
      this.moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.test',
          }),
          TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
              const config = {
                type: 'postgres' as const,
                host: configService.get<string>('DB_HOST') || 'localhost',
                port: parseInt(
                  configService.get<string>('DB_PORT') || '5432',
                  10,
                ),
                username: configService.get<string>('DB_USERNAME') || 'mohamed',
                password: configService.get<string>('DB_PASSWORD') || 'asd',
                database:
                  configService.get<string>('DB_DATABASE') || 'idecides',
                entities: [
                  User,
                  Student,
                  Advisor,
                  Admin,
                  University,
                  College,
                  Major,
                  Scholarship,
                  Message,
                  FavoriteUniversity,
                  FavoriteScholarship,
                ],
                synchronize: true,
                dropSchema: false, // Changed to false to avoid schema recreation issues
                logging: false,
                // Connection pool settings for tests
                maxQueryExecutionTime: 60000,
                connectTimeoutMS: 60000,
                acquireTimeoutMillis: 60000,
                timeout: 60000,
                retryAttempts: 5,
                retryDelay: 3000,
                extra: {
                  connectionTimeoutMillis: 60000,
                  idleTimeoutMillis: 60000,
                  max: 5,
                  statement_timeout: 60000,
                  query_timeout: 60000,
                },
              };

              console.log('[IntegrationTestSetup] Database config:', {
                host: config.host,
                port: config.port,
                username: config.username,
                database: config.database,
              });

              return config;
            },
            inject: [ConfigService],
          }),
          JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
              secret: configService.get('JWT_ACCESS_SECRET') || 'test-secret',
              signOptions: { expiresIn: '24h' },
            }),
            inject: [ConfigService],
          }),
          moduleToTest,
        ],
      }).compile();

      this.app = this.moduleRef.createNestApplication();

      // Apply middleware and pipes
      this.app.use(cookieParser());
      this.app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
      );

      await this.app.init();
      this.dataSource = this.app.get(DataSource);

      // Wait for the database to be ready
      await this.waitForDatabase();

      // Ensure all tables are created
      await this.ensureTablesExist();

      console.log(
        '[IntegrationTestSetup] Test app setup completed successfully',
      );
      return this.app;
    } catch (error) {
      console.error('[IntegrationTestSetup] Error setting up test app:', error);
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
          console.log('[IntegrationTestSetup] Database connection established');
          return;
        }
        throw new Error('DataSource not initialized');
      } catch (error) {
        retries++;
        console.log(
          `[IntegrationTestSetup] Database connection attempt ${retries}/${maxRetries} failed:`,
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

  private async ensureTablesExist(): Promise<void> {
    if (!this.dataSource || !this.dataSource.isInitialized) return;

    try {
      // Run synchronization to ensure all tables exist
      await this.dataSource.synchronize(false);
      console.log('[IntegrationTestSetup] Tables synchronized successfully');
    } catch (error) {
      console.error(
        '[IntegrationTestSetup] Error synchronizing tables:',
        error,
      );
      // If sync fails, try manual table creation
      try {
        await this.dataSource.runMigrations();
        console.log('[IntegrationTestSetup] Migrations run successfully');
      } catch (migrationError) {
        console.error(
          '[IntegrationTestSetup] Migration error:',
          migrationError,
        );
      }
    }
  }

  async clearDatabase(): Promise<void> {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      console.warn(
        '[IntegrationTestSetup] DataSource not available for clearing',
      );
      return;
    }

    try {
      // Get all table names
      const tables = await this.dataSource.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
      `);

      if (tables.length === 0) {
        console.log('[IntegrationTestSetup] No tables to clear');
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

      console.log('[IntegrationTestSetup] Database cleared successfully');
    } catch (error) {
      console.error('[IntegrationTestSetup] Error clearing database:', error);
      // Fallback method if transaction fails
      try {
        const entities = this.dataSource.entityMetadatas;
        for (const entity of entities.reverse()) {
          const repository = this.dataSource.getRepository(entity.name);
          await repository.clear();
        }
      } catch (fallbackError) {
        console.error(
          '[IntegrationTestSetup] Fallback clear also failed:',
          fallbackError,
        );
      }
    }
  }

  async closeApp(): Promise<void> {
    console.log('[IntegrationTestSetup] Closing test app...');

    try {
      if (this.dataSource && this.dataSource.isInitialized) {
        await this.dataSource.destroy();
        console.log('[IntegrationTestSetup] DataSource destroyed');
      }

      if (this.app) {
        await this.app.close();
        console.log('[IntegrationTestSetup] App closed');
      }

      if (this.moduleRef) {
        await this.moduleRef.close();
        console.log('[IntegrationTestSetup] Module closed');
      }
    } catch (error) {
      console.error('[IntegrationTestSetup] Error closing app:', error);
    }
  }

  getRepository(entity: any) {
    return this.dataSource?.getRepository(entity);
  }
}
