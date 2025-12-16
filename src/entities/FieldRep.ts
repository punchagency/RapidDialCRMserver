import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('field_reps')
export class FieldRep {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'varchar', length: 20 })
  territory!: string;

  @Column({ name: 'home_zip_code', type: 'varchar', length: 10, nullable: true })
  homeZipCode?: string;

  @Column({ name: 'home_lat', type: 'decimal', precision: 10, scale: 8, nullable: true })
  homeLat?: string;

  @Column({ name: 'home_lng', type: 'decimal', precision: 11, scale: 8, nullable: true })
  homeLng?: string;

  @Column({ name: 'google_calendar_id', type: 'varchar', length: 255, nullable: true })
  googleCalendarId?: string;

  @Column({ name: 'google_refresh_token', type: 'text', nullable: true })
  googleRefreshToken?: string;

  @Column({
    name: 'work_schedule',
    type: 'json',
    nullable: true,
  })
  workSchedule?: {
    daysOfWeek: string[];
    startTime: string;
    endTime: string;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations - using string reference to avoid circular dependency
  @OneToMany('Appointment', 'fieldRep')
  appointments?: any[];
}

