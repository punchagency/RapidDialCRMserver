import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("call_history")
export class CallHistory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "prospect_id", type: "varchar", nullable: true })
  prospectId?: string;

  @Column({ name: "caller_id", type: "varchar", length: 100, nullable: true })
  callerId?: string;

  @Column({
    name: "field_rep_id",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  fieldRepId?: string;

  @Column({
    name: "call_duration",
    type: "int",
    nullable: true,
  })
  callDuration?: number;

  @Column({
    name: "recording_url",
    type: "varchar",
    length: 150,
    nullable: true,
  })
  recordingUrl?: string;

  @Column({
    name: "call_sid",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  callSid?: string;

  @Column({
    name: "attempt_date",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  attemptDate!: Date;

  @Column({
    name: "status",
    type: "varchar",
    length: 20,
    default: "pending",
  })
  status!: string;

  @Column({ type: "varchar", length: 50 })
  outcome!: string;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  // Relations - using string reference to avoid circular dependency
  @ManyToOne("Prospect", "callHistory")
  @JoinColumn({ name: "prospect_id" })
  prospect?: any;
}
