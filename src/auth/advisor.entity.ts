import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Advisor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  communationEmail: string;

  @Column({ nullable: true })
  communicationNumber: string;

  @Column({ nullable: true })
  identificationPic: string;

  @Column({ default: false })
  isIdentified: boolean;

  @OneToOne(() => User, (user) => user.advisor, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
