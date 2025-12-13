import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('user_territories')
export class UserTerritory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar' })
  userId!: string;

  @Column({ type: 'varchar', length: 50 })
  territory!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations - using string reference to avoid circular dependency
  @ManyToOne('User', 'userTerritories')
  @JoinColumn({ name: 'user_id' })
  user!: any;
}

