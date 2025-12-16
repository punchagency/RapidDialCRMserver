import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'prospect_id', type: 'varchar', nullable: true })
  prospectId?: string;

  @Column({ name: 'field_rep_id', type: 'varchar', nullable: true })
  fieldRepId?: string;

  @Column({ name: 'scheduled_date', type: 'date' })
  scheduledDate!: string;

  @Column({ name: 'scheduled_time', type: 'time' })
  scheduledTime!: string;

  @Column({ name: 'duration_minutes', type: 'int', default: 45 })
  durationMinutes!: number;

  @Column({ name: 'google_calendar_event_id', type: 'varchar', length: 255, nullable: true })
  googleCalendarEventId?: string;

  @Column({ type: 'varchar', length: 50, default: 'confirmed' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations - using string reference to avoid circular dependency
  @ManyToOne('Prospect', 'appointments')
  @JoinColumn({ name: 'prospect_id' })
  prospect?: any;

  @ManyToOne('FieldRep', 'appointments')
  @JoinColumn({ name: 'field_rep_id' })
  fieldRep?: any;
}

