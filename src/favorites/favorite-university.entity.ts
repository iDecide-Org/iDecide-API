import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Column,
} from 'typeorm';
import { User } from '../auth/users/user.entity';
import { University } from '../universities/university.entity';

@Entity()
@Unique(['user', 'university']) // Ensure a user can only favorite a university once
export class FavoriteUniversity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.favoriteUniversityLinks, {
    onDelete: 'CASCADE',
  }) // Corrected property name
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => University, { onDelete: 'CASCADE', eager: true }) // Eager load university details
  @JoinColumn({ name: 'universityId' })
  university: University;

  @Column()
  universityId: string;
}
