import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,

} from 'typeorm';

@Entity('specialty_colors')
export class SpecialtyColor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  specialty!: string;

  @Column({ name: 'bg_color', type: 'varchar', length: 20, default: 'bg-blue-100' })
  bgColor!: string;

  @Column({ name: 'text_color', type: 'varchar', length: 20, default: 'text-blue-700' })
  textColor!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

