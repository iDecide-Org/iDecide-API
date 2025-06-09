import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { User } from '../src/auth/users/user.entity';

describe('Database Connection Test', () => {
  let dataSource: DataSource;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres' as const,
            host: configService.get<string>('DB_HOST') || 'localhost',
            port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
            username: configService.get<string>('DB_USERNAME') || 'mohamed',
            password: configService.get<string>('DB_PASSWORD') || 'asd',
            database:
              configService.get<string>('DB_DATABASE') || 'idecide_test',
            entities: [User],
            synchronize: true,
            dropSchema: true,
            logging: false,
          }),
          inject: [ConfigService],
        }),
      ],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
  }, 60000);

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    if (module) {
      await module.close();
    }
  });

  it('should connect to the database', async () => {
    expect(dataSource).toBeDefined();
    expect(dataSource.isInitialized).toBe(true);
  });

  it('should be able to query the database', async () => {
    const result = await dataSource.query('SELECT 1 as test');
    expect(result).toEqual([{ test: 1 }]);
  });
});
