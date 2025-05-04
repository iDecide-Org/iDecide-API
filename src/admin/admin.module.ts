import { Module, forwardRef } from '@nestjs/common'; // Keep forwardRef if circular dependency exists
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../auth/users/user.entity';
import { University } from '../universities/university.entity';
import { Scholarship } from '../scholarships/scholarship.entity';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule
import { Admin } from 'typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, University, Scholarship]),
    // Import AuthModule here. Use forwardRef if AuthModule imports AdminModule or AdminService.
    // If there's no circular dependency, you can remove forwardRef.
    forwardRef(() => AuthModule),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService], // Export AdminService if other modules need it
})
export class AdminModule {}
