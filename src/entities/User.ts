import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export type UserRole =
  | 'admin'
  | 'manager'
  | 'inside_sales_rep'
  | 'field_sales_rep'
  | 'data_loader';

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CREATED = 'created',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'varchar', length: 50, default: 'data_loader' })
  role!: UserRole;

  @Column({ type: 'varchar', length: 50, nullable: true })
  territory?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'invite_status', type: 'enum', enum: InviteStatus, default: InviteStatus.PENDING })
  inviteStatus!: InviteStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations - using string reference to avoid circular dependency
  @OneToMany('UserTerritory', 'user')
  userTerritories?: any[];

  @OneToMany('UserProfession', 'user')
  userProfessions?: any[];
}

