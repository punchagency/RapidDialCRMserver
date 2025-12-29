import {
 Entity,
 PrimaryGeneratedColumn,
 Column,
 CreateDateColumn,
 UpdateDateColumn,
} from 'typeorm';

@Entity('email_templates')
export class EmailTemplate {
 @PrimaryGeneratedColumn('uuid')
 id!: string;

 @Column({ type: 'varchar', length: 255 })
 name!: string;

 @Column({ type: 'varchar', length: 500 })
 subject!: string;

 @Column({ type: 'text' })
 body!: string;

 @Column({ type: 'varchar', length: 100, nullable: true })
 specialty?: string;

 @CreateDateColumn({ name: 'created_at' })
 createdAt!: Date;

 @UpdateDateColumn({ name: 'updated_at' })
 updatedAt!: Date;
}

