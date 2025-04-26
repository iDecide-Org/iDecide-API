import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { University } from './university.entity';
import { UniversitiesController } from './universities.controller';
import { UniversitiesService } from './universities.service';
import { UniversitiesRepository } from './universities.repository';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule to use UserRepository, JwtService

@Module({
  imports: [
    TypeOrmModule.forFeature([University]),
    AuthModule, // Import AuthModule here
  ],
  controllers: [UniversitiesController],
  providers: [UniversitiesService, UniversitiesRepository],
  exports: [UniversitiesService, UniversitiesRepository], // Export if needed elsewhere
})
export class UniversitiesModule {}
