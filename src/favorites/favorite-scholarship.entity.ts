import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique, Column } from 'typeorm';
import { User } from '../auth/users/user.entity';
import { Scholarship } from '../scholarships/scholarship.entity';

@Entity()
@Unique(['user', 'scholarship']) // Ensure a user can only favorite a scholarship once
export class FavoriteScholarship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.favoriteScholarshipLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Scholarship, { onDelete: 'CASCADE', eager: true }) // Eager load scholarship details
  @JoinColumn({ name: 'scholarshipId' })
  scholarship: Scholarship;

  @Column()
  scholarshipId: string;
}
