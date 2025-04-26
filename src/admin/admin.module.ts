import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/users/user.entity';
import { University } from '../universities/university.entity';
import { Scholarship } from '../scholarships/scholarship.entity';
import { AuthService } from '../auth/auth.service';
import { AuthModule } from '../auth/auth.module';
import { Admin } from '../auth/users/admin.entity'; // Import Admin

@Module({
  imports: [
    TypeOrmModule.forFeature([User, University, Scholarship, Admin]), // Add Admin
    AuthModule, // <-- Fix: import AuthModule for JwtService/AuthService
  ],
  controllers: [AdminController],
  providers: [AdminService, AuthService],
  exports: [AdminService],
})
export class AdminModule {}
