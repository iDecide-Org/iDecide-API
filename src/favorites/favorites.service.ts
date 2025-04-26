import { Injectable } from '@nestjs/common';
import { FavoritesRepository } from './favorite.repository';
import { FavoriteUniversity } from './favorite-university.entity';
import { FavoriteScholarship } from './favorite-scholarship.entity'; // Import FavoriteScholarship

@Injectable()
export class FavoritesService {
  constructor(private readonly favoritesRepository: FavoritesRepository) {}

  // --- University Methods ---
  async addUniversityToFavorites(userId: string, universityId: string): Promise<FavoriteUniversity> {
    return this.favoritesRepository.addFavoriteUniversity(userId, universityId);
  }

  async removeUniversityFromFavorites(userId: string, universityId: string): Promise<void> {
    await this.favoritesRepository.removeFavoriteUniversity(userId, universityId);
  }

  async getUserFavoriteUniversities(userId: string): Promise<FavoriteUniversity[]> {
    return this.favoritesRepository.findUserFavoriteUniversities(userId);
  }

  async isUniversityFavorite(userId: string, universityId: string): Promise<boolean> {
    return this.favoritesRepository.isUniversityFavorite(userId, universityId);
  }

  // --- Scholarship Methods ---
  async addScholarshipToFavorites(userId: string, scholarshipId: string): Promise<FavoriteScholarship> {
    return this.favoritesRepository.addFavoriteScholarship(userId, scholarshipId);
  }

  async removeScholarshipFromFavorites(userId: string, scholarshipId: string): Promise<void> {
    await this.favoritesRepository.removeFavoriteScholarship(userId, scholarshipId);
  }

  async getUserFavoriteScholarships(userId: string): Promise<FavoriteScholarship[]> {
    return this.favoritesRepository.findUserFavoriteScholarships(userId);
  }
}
