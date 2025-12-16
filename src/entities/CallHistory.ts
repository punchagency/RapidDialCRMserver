import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('call_history')
export class CallHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'prospect_id', type: 'varchar', nullable: true })
  prospectId?: string;

  @Column({ name: 'caller_id', type: 'varchar', length: 100, nullable: true })
  callerId?: string;

  @Column({ name: 'attempt_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  attemptDate!: Date;

  @Column({ type: 'varchar', length: 50 })
  outcome!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations - using string reference to avoid circular dependency
  @ManyToOne('Prospect', 'callHistory')
  @JoinColumn({ name: 'prospect_id' })
  prospect?: any;
}

