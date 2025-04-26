import { User } from '../auth/users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FavoriteUniversity } from '../favorites/favorite-university.entity';

export enum UniversityType {
  GOVERNMENTAL = 'حكومية',
  PRIVATE = 'خاصة',
  NATIONAL = 'أهلية', // Ahleya
}

@Entity()
export class University {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  location: string;

  @Column({
    type: 'enum',
    enum: UniversityType,
  })
  type: UniversityType;

  @Column({ type: 'int' }) // Use integer for year
  establishment: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  collegesCount: number;

  @Column({ type: 'int' })
  majorsCount: number;

  @Column({ nullable: true }) // Store image path or URL
  image: string;

  @ManyToOne(() => User, (user) => user.createdUniversities, {
    onDelete: 'SET NULL',
    nullable: true,
  }) // Link to the advisor (User), set null on delete
  @JoinColumn({ name: 'advisorId' }) // Explicitly name the foreign key column
  advisor: User;

  @Column({ nullable: true }) // Store the advisor's ID directly, allow null
  advisorId: string;

  @ManyToOne(() => User, (user) => user.universities, { onDelete: 'CASCADE' }) // Add onDelete: 'CASCADE'
  @JoinColumn({ name: 'addedById' })
  addedBy: User;

  @Column({ nullable: true }) // Allow nulls for existing rows
  addedById: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
