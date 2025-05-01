import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { University } from 'src/universities/university.entity';
import { Major } from 'src/majors/entities/major.entity';

@Entity()
export class College {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  website: string;

  @ManyToOne(() => University, (university) => university.colleges, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'universityId' })
  university: University;

  @Column()
  universityId: string;

  @OneToMany(() => Major, (major) => major.college)
  majors: Major[];
}
