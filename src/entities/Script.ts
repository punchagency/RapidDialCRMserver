import {
 Entity,
 PrimaryGeneratedColumn,
 Column,
 CreateDateColumn,
 UpdateDateColumn,
 ManyToOne,
 JoinColumn,
} from 'typeorm';

@Entity('scripts')
export class Script {
 @PrimaryGeneratedColumn('uuid')
 id!: string;

 @Column({ type: 'varchar', length: 255 })
 name!: string;

 @Column({ type: 'varchar', length: 50, nullable: true })
 profession?: string | null;

 @Column({ type: 'text' })
 content!: string;

 @Column({
  name: 'dynamic_fields',
  type: 'json',
  nullable: true
 })
 dynamicFields?: string[];

 @Column({
  name: 'branches',
  type: 'json',
  nullable: true
 })
 branches?: Array<{
  id: string;
  condition: string;
  action: string;
  content: string;
 }>;

 @Column({ type: 'int', default: 1 })
 version!: number;

 @Column({ name: 'is_published', type: 'boolean', default: false })
 isPublished!: boolean;

 @Column({ name: 'is_default', type: 'boolean', default: false })
 isDefault!: boolean;

 @CreateDateColumn({ name: 'created_at' })
 createdAt!: Date;

 @UpdateDateColumn({ name: 'updated_at' })
 updatedAt!: Date;
}

