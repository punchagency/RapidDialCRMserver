import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,

} from 'typeorm';

@Entity('call_outcomes')
export class CallOutcome {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  label!: string;

  @Column({ name: 'bg_color', type: 'varchar', length: 30 })
  bgColor!: string;

  @Column({ name: 'text_color', type: 'varchar', length: 30 })
  textColor!: string;

  @Column({ name: 'border_color', type: 'varchar', length: 30, nullable: true })
  borderColor?: string;

  @Column({ name: 'hover_color', type: 'varchar', length: 30, nullable: true })
  hoverColor?: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

