import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteUniversity } from './favorite-university.entity';
import { FavoriteScholarship } from './favorite-scholarship.entity'; // Import FavoriteScholarship
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { FavoritesRepository } from './favorite.repository';
import { AuthModule } from '../auth/auth.module'; // For JWT and User Repo

@Module({
  imports: [
    TypeOrmModule.forFeature([FavoriteUniversity, FavoriteScholarship]), // Add FavoriteScholarship here
    AuthModule, // Import AuthModule
  ],
  controllers: [FavoritesController],
  providers: [FavoritesService, FavoritesRepository],
})
export class FavoritesModule {}
