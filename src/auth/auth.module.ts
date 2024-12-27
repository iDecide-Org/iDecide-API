import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { Student } from './users/student.entity';
import { Advisor } from './users/advisor.entity';
import { UserRepository } from './users/users.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, Student, Advisor])],
  controllers: [AuthController],
  providers: [AuthService, UserRepository],
})
export class AuthModule {}
