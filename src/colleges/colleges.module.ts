import { Module } from '@nestjs/common';
import { CollegesService } from './colleges.service';
import { CollegesController } from './colleges.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { College } from './entities/college.entity';
import { CollegesRepository } from './colleges.repository';
import { University } from '../universities/university.entity'; // Import University
import { AuthModule } from '../auth/auth.module'; // Import AuthModule for guards

@Module({
  imports: [
    TypeOrmModule.forFeature([College, University]), // Include University repository
    AuthModule, // Import AuthModule for AuthGuard/AdvisorGuard
  ],
  controllers: [CollegesController],
  providers: [CollegesService, CollegesRepository],
  exports: [CollegesService, CollegesRepository],
})
export class CollegesModule {}
