import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Student } from './student.entity';
import { UserRepository } from './users.repository';
import { Advisor } from './advisor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Student, Advisor])],
  controllers: [AuthController],
  providers: [AuthService, UserRepository],
})
export class AuthModule {}
