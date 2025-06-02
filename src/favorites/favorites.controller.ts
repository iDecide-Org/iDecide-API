import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UnauthorizedException,
  UseGuards, // Import UseGuards
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { AuthGuard } from '@nestjs/passport'; // Import AuthGuard
import { Request } from 'express';
import { User } from '../auth/users/user.entity'; // Ensure User entity is imported

@Controller('favorites')
@UseGuards(AuthGuard('jwt')) // Apply guard to all routes in this controller
export class FavoritesController {
  constructor(
    private readonly favoritesService: FavoritesService,
    // Remove jwtService and userRepository if no longer needed
  ) {}

  // --- University Favorites ---

  @Get('/universities')
  async getFavoriteUniversities(@Req() req: Request) {
    const user = req.user as User; // Access user from request
    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated or ID missing.');
    }
    return this.favoritesService.getUserFavoriteUniversities(user.id);
  }

  @Get('/universities/check/:universityId')
  async checkFavoriteUniversity(
    @Param('universityId', ParseUUIDPipe) universityId: string,
    @Req() req: Request,
  ) {
    const user = req.user as User; // Access user from request
    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated or ID missing.');
    }
    const isFavorite = await this.favoritesService.isUniversityFavorite(
      user.id,
      universityId,
    );
    return { isFavorite };
  }

  @Post('/universities/:universityId')
  @HttpCode(HttpStatus.CREATED)
  async addFavoriteUniversity(
    @Param('universityId', ParseUUIDPipe) universityId: string,
    @Req() req: Request,
  ) {
    const user = req.user as User; // Access user from request
    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated or ID missing.');
    }
    return this.favoritesService.addUniversityToFavorites(
      user.id,
      universityId,
    );
  }

  @Delete('/universities/:universityId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFavoriteUniversity(
    @Param('universityId', ParseUUIDPipe) universityId: string,
    @Req() req: Request,
  ) {
    const user = req.user as User; // Access user from request
    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated or ID missing.');
    }
    await this.favoritesService.removeUniversityFromFavorites(
      user.id,
      universityId,
    );
  }

  // --- Scholarship Favorites ---

  @Get('/scholarships')
  async getFavoriteScholarships(@Req() req: Request) {
    const user = req.user as User; // Access user from request
    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated or ID missing.');
    }
    return this.favoritesService.getUserFavoriteScholarships(user.id);
  }

  @Post('/scholarships/:scholarshipId')
  @HttpCode(HttpStatus.CREATED)
  async addFavoriteScholarship(
    @Param('scholarshipId', ParseUUIDPipe) scholarshipId: string,
    @Req() req: Request,
  ) {
    const user = req.user as User; // Access user from request
    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated or ID missing.');
    }
    return this.favoritesService.addScholarshipToFavorites(
      user.id,
      scholarshipId,
    );
  }

  @Delete('/scholarships/:scholarshipId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFavoriteScholarship(
    @Param('scholarshipId', ParseUUIDPipe) scholarshipId: string,
    @Req() req: Request,
  ) {
    const user = req.user as User; // Access user from request
    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated or ID missing.');
    }
    await this.favoritesService.removeScholarshipFromFavorites(
      user.id,
      scholarshipId,
    );
  }
}
