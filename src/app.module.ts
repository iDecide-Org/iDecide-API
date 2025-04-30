import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/users/user.entity';
import { Student } from './auth/users/student.entity';
import { Advisor } from './auth/users/advisor.entity';
import { Admin } from './auth/users/admin.entity'; // Import Admin
import { ChatModule } from './chat/chat.module'; // Import ChatModule
import { Message } from './chat/message.entity'; // Import Message entity
import { University } from './universities/university.entity'; // Import University entity
import { UniversitiesModule } from './universities/universities.module'; // Import UniversitiesModule
import { FavoriteUniversity } from './favorites/favorite-university.entity'; // Import FavoriteUniversity
import { FavoritesModule } from './favorites/favorites.module'; // Import FavoritesModule
import { Scholarship } from './scholarships/scholarship.entity'; // Import Scholarship entity
import { ScholarshipsModule } from './scholarships/scholarship.module'; // Import ScholarshipModule
import { FavoriteScholarship } from './favorites/favorite-scholarship.entity'; // Import FavoriteScholarship
import { AdminModule } from './admin/admin.module';
import { CollegesModule } from './colleges/colleges.module';
import { MajorsModule } from './majors/majors.module';
import { College } from './colleges/entities/college.entity'; // Import College entity
import { Major } from './majors/entities/major.entity'; // Import Major entity
import { LoggerModule } from 'nestjs-pino'; // Import LoggerModule

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
      },
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost', // Use environment variable or default
      port: parseInt(process.env.DB_PORT, 10) || 32768, // Use environment variable or default
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'idecide',
      entities: [
        User,
        Student,
        Advisor,
        Admin, // Add Admin
        Message,
        University,
        FavoriteUniversity,
        Scholarship, // Add Scholarship
        FavoriteScholarship, // Add FavoriteScholarship
        College, // Add College entity
        Major, // Add Major entity
      ],
      synchronize: process.env.NODE_ENV !== 'production', // synchronize: true only in dev
    }),
    AuthModule,
    ChatModule,
    UniversitiesModule,
    FavoritesModule,
    ScholarshipsModule,
    AdminModule,
    CollegesModule,
    MajorsModule, // Add ScholarshipModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
