import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { College } from 'src/colleges/entities/college.entity';

@Entity()
export class Major {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => College, (college) => college.majors, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'collegeId' })
  college: College;

  @Column()
  collegeId: string;
}
