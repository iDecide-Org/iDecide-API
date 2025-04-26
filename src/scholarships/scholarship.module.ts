import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scholarship } from './scholarship.entity';
import { ScholarshipsController } from './scholarship.controller';
import { ScholarshipsService } from './scholarship.service';
import { ScholarshipsRepository } from './scholarship.repository';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule for dependencies

@Module({
  imports: [
    TypeOrmModule.forFeature([Scholarship]),
    AuthModule, // Import AuthModule to provide JwtService and UserRepository
  ],
  controllers: [ScholarshipsController],
  providers: [ScholarshipsService, ScholarshipsRepository],
  exports: [ScholarshipsService, ScholarshipsRepository], // Export if needed elsewhere
})
export class ScholarshipsModule {}
