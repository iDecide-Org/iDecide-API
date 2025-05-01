import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { University } from 'src/universities/university.entity';
import { Major } from 'src/majors/entities/major.entity';

@Entity('college')
export class College {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true }) // Add location column
  location: string;

  @Column({ nullable: true }) // Add website column
  website: string;

  @Column()
  universityId: string;

  @ManyToOne(() => University, (university) => university.colleges, {
    onDelete: 'CASCADE', // Ensure colleges are deleted if university is deleted
  })
  @JoinColumn({ name: 'universityId' }) // Explicitly define the join column
  university: University;

  @OneToMany(() => Major, (major) => major.college, {
    cascade: true, // Ensure majors are handled when college changes
    eager: false, // Load majors only when explicitly requested
  })
  majors: Major[];
}
