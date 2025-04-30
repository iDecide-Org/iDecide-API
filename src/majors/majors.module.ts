import { Module } from '@nestjs/common';
import { MajorsService } from './majors.service';
import { MajorsController } from './majors.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Major } from './entities/major.entity';
import { MajorsRepository } from './majors.repository';
import { College } from '../colleges/entities/college.entity'; // Import College
import { AuthModule } from '../auth/auth.module'; // Import AuthModule for guards

@Module({
  imports: [
    TypeOrmModule.forFeature([Major, College]), // Include College repository
    AuthModule, // Import AuthModule for AuthGuard/AdvisorGuard
  ],
  controllers: [MajorsController],
  providers: [MajorsService, MajorsRepository],
  exports: [MajorsService, MajorsRepository],
})
export class MajorsModule {}
