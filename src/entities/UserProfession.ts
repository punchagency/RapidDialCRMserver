import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('user_professions')
export class UserProfession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar' })
  userId!: string;

  @Column({ type: 'varchar', length: 50 })
  profession!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations - using string reference to avoid circular dependency
  @ManyToOne('User', 'userProfessions')
  @JoinColumn({ name: 'user_id' })
  user!: any;
}

