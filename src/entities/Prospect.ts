import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('prospects')
export class Prospect {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_name', type: 'text' })
  businessName!: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 20 })
  phoneNumber!: string;

  @Column({ name: 'address_street', type: 'varchar', length: 255, nullable: true })
  addressStreet?: string;

  @Column({ name: 'address_city', type: 'varchar', length: 100, nullable: true })
  addressCity?: string;

  @Column({ name: 'address_state', type: 'varchar', length: 2, nullable: true })
  addressState?: string;

  @Column({ name: 'address_zip', type: 'varchar', length: 10, nullable: true })
  addressZip?: string;

  @Column({ name: 'address_lat', type: 'decimal', precision: 10, scale: 8, nullable: true })
  addressLat?: string;

  @Column({ name: 'address_lng', type: 'decimal', precision: 11, scale: 8, nullable: true })
  addressLng?: string;

  @Column({ type: 'varchar', length: 50 })
  specialty!: string;

  @Column({ type: 'varchar', length: 20 })
  territory!: string;

  @Column({ name: 'office_email', type: 'varchar', length: 255, nullable: true })
  officeEmail?: string;

  @Column({ name: 'last_contact_date', type: 'timestamp', nullable: true })
  lastContactDate?: Date;

  @Column({ name: 'last_call_outcome', type: 'varchar', length: 50, nullable: true })
  lastCallOutcome?: string;

  @Column({
    name: 'appointment_status',
    type: 'json',
    nullable: true,
  })
  appointmentStatus?: {
    isBooked: boolean;
    scheduledDate: string | null;
    fieldRepId: string | null;
  };

  @Column({ name: 'priority_score', type: 'int', nullable: true })
  priorityScore?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations - using string reference to avoid circular dependency
  @OneToMany('Stakeholder', 'prospect')
  stakeholders?: any[];

  @OneToMany('CallHistory', 'prospect')
  callHistory?: any[];

  @OneToMany('Appointment', 'prospect')
  appointments?: any[];
}

