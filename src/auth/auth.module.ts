import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { Student } from './users/student.entity';
import { Advisor } from './users/advisor.entity';
import { Admin } from './users/admin.entity';
import { UserRepository } from './users/users.repository';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport'; // Import PassportModule
import { JwtStrategy } from './strategies/jwt.strategy'; // Import JwtStrategy

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }), // Register PassportModule
    TypeOrmModule.forFeature([User, Student, Advisor, Admin]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'YOUR_DEFAULT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d'),
        },
      }),
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, JwtStrategy], // Add JwtStrategy to providers
  exports: [JwtModule, UserRepository, AuthService, PassportModule], // Export PassportModule if needed elsewhere
})
export class AuthModule {}
