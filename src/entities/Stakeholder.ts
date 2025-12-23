import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('stakeholders')
export class Stakeholder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'prospect_id', type: 'varchar' })
  prospectId!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  title?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber?: string;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contactType?: "client-admin" | "provider";

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations - using string reference to avoid circular dependency
  @ManyToOne('Prospect', 'stakeholders')
  @JoinColumn({ name: 'prospect_id' })
  prospect!: any;
}

