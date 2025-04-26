import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoriteUniversity } from './favorite-university.entity';
import { FavoriteScholarship } from './favorite-scholarship.entity'; // Import FavoriteScholarship
import { User } from '../auth/users/user.entity';

@Injectable()
export class FavoritesRepository {
  constructor(
    @InjectRepository(FavoriteUniversity)
    private readonly favUniversityRepository: Repository<FavoriteUniversity>,
    @InjectRepository(FavoriteScholarship) // Inject FavoriteScholarship repository
    private readonly favScholarshipRepository: Repository<FavoriteScholarship>,
  ) {}

  // --- University Methods ---
  async addFavoriteUniversity(
    userId: string,
    universityId: string,
  ): Promise<FavoriteUniversity> {
    const favorite = this.favUniversityRepository.create({
      userId,
      universityId,
    });
    try {
      await this.favUniversityRepository.save(favorite);
      // Re-fetch with relation to return the full university object
      return this.favUniversityRepository.findOne({
        where: { id: favorite.id },
        relations: ['university'],
      });
    } catch (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new ConflictException('University already in favorites.');
      }
      console.error('Error adding favorite university:', error);
      throw new InternalServerErrorException('Failed to add favorite.');
    }
  }

  async removeFavoriteUniversity(
    userId: string,
    universityId: string,
  ): Promise<void> {
    const result = await this.favUniversityRepository.delete({
      userId,
      universityId,
    });
    if (result.affected === 0) {
      throw new NotFoundException('Favorite university not found.');
    }
  }

  async findUserFavoriteUniversities(
    userId: string,
  ): Promise<FavoriteUniversity[]> {
    try {
      // Fetch favorites and eagerly load the related university details
      return await this.favUniversityRepository.find({
        where: { userId },
        relations: ['university'], // Ensure the relation name matches the entity definition
      });
    } catch (error) {
      console.error('Error finding favorite universities:', error);
      throw new InternalServerErrorException('Failed to retrieve favorites.');
    }
  }

  async isUniversityFavorite(
    userId: string,
    universityId: string,
  ): Promise<boolean> {
    try {
      const favorite = await this.favUniversityRepository.findOne({
        where: { userId, universityId },
      });
      return !!favorite; // Return true if favorite exists, false otherwise
    } catch (error) {
      console.error('Error checking favorite university status:', error);
      throw new InternalServerErrorException(
        'Failed to check favorite status.',
      );
    }
  }

  // --- Scholarship Methods ---
  async addFavoriteScholarship(
    userId: string,
    scholarshipId: string,
  ): Promise<FavoriteScholarship> {
    const favorite = this.favScholarshipRepository.create({
      userId,
      scholarshipId,
    });
    try {
      await this.favScholarshipRepository.save(favorite);
      // Re-fetch with relation to return the full scholarship object
      return this.favScholarshipRepository.findOne({
        where: { id: favorite.id },
        relations: ['scholarship'],
      });
    } catch (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new ConflictException('Scholarship already in favorites.');
      }
      console.error('Error adding favorite scholarship:', error);
      throw new InternalServerErrorException(
        'Failed to add favorite scholarship.',
      );
    }
  }

  async removeFavoriteScholarship(
    userId: string,
    scholarshipId: string,
  ): Promise<void> {
    const result = await this.favScholarshipRepository.delete({
      userId,
      scholarshipId,
    });
    if (result.affected === 0) {
      throw new NotFoundException('Favorite scholarship not found.');
    }
  }

  async findUserFavoriteScholarships(
    userId: string,
  ): Promise<FavoriteScholarship[]> {
    try {
      // Fetch favorites and eagerly load the related scholarship details
      return await this.favScholarshipRepository.find({
        where: { userId },
        relations: ['scholarship'], // Ensure the relation name matches the entity definition
      });
    } catch (error) {
      console.error('Error finding favorite scholarships:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve favorite scholarships.',
      );
    }
  }
}
