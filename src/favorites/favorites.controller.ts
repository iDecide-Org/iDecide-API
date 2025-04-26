import { Controller, Post, Delete, Get, Param, Req, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe, UnauthorizedException } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
// import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../auth/users/users.repository';

@Controller('favorites')
// @UseGuards(AuthGuard) // Protect all routes in this controller
export class FavoritesController {
  constructor(
    private readonly favoritesService: FavoritesService,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    ) {}

   // Helper to get user ID from request
  private async getUserIdFromRequest(request: Request): Promise<string> {
    const cookie = request.cookies['jwt'];
    if (!cookie) throw new UnauthorizedException('JWT cookie not found.');
    try {
      const data = await this.jwtService.verifyAsync(cookie);
      if (!data || !data['id']) throw new UnauthorizedException('Invalid JWT data.');
      // Optional: Verify user exists
      // const user = await this.userRepository.findById(data['id']);
      // if (!user) throw new UnauthorizedException('User not found.');
      return data['id'];
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired JWT.');
    }
  }

  // --- University Favorites ---

  @Get('/universities')
  async getFavoriteUniversities(@Req() request: Request) {
    const userId = await this.getUserIdFromRequest(request);
    return this.favoritesService.getUserFavoriteUniversities(userId);
  }

  @Get('/universities/check/:universityId')
  async checkFavoriteUniversity(
    @Param('universityId', ParseUUIDPipe) universityId: string,
    @Req() request: Request,
  ) {
    const userId = await this.getUserIdFromRequest(request);
    const isFavorite = await this.favoritesService.isUniversityFavorite(userId, universityId);
    return { isFavorite };
  }

  @Post('/universities/:universityId')
  @HttpCode(HttpStatus.CREATED)
  async addFavoriteUniversity(
    @Param('universityId', ParseUUIDPipe) universityId: string,
    @Req() request: Request,
  ) {
    const userId = await this.getUserIdFromRequest(request);
    return this.favoritesService.addUniversityToFavorites(userId, universityId);
  }

  @Delete('/universities/:universityId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFavoriteUniversity(
    @Param('universityId', ParseUUIDPipe) universityId: string,
    @Req() request: Request,
  ) {
     const userId = await this.getUserIdFromRequest(request);
    await this.favoritesService.removeUniversityFromFavorites(userId, universityId);
  }

  // --- Scholarship Favorites ---

  @Get('/scholarships')
  async getFavoriteScholarships(@Req() request: Request) {
    const userId = await this.getUserIdFromRequest(request);
    return this.favoritesService.getUserFavoriteScholarships(userId);
  }

  @Post('/scholarships/:scholarshipId')
  @HttpCode(HttpStatus.CREATED)
  async addFavoriteScholarship(
    @Param('scholarshipId', ParseUUIDPipe) scholarshipId: string,
    @Req() request: Request,
  ) {
    const userId = await this.getUserIdFromRequest(request);
    return this.favoritesService.addScholarshipToFavorites(userId, scholarshipId);
  }

  @Delete('/scholarships/:scholarshipId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFavoriteScholarship(
    @Param('scholarshipId', ParseUUIDPipe) scholarshipId: string,
    @Req() request: Request,
  ) {
    const userId = await this.getUserIdFromRequest(request);
    await this.favoritesService.removeScholarshipFromFavorites(userId, scholarshipId);
  }
}
