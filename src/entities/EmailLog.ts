import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("email_logs")
export class EmailLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  to!: string;

  @Column({ type: "varchar", length: 500 })
  subject!: string;

  @Column({ type: "text" })
  body!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  title?: string;

  @Column({ type: "varchar", length: 50, default: "sent" })
  status!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
