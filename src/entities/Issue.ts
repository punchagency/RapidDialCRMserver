import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,

} from 'typeorm';

export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
export type IssuePriority = 0 | 1 | 2 | 3 | 4;

@Entity('issues')
export class Issue {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, default: 'backlog' })
  status!: IssueStatus;

  @Column({ type: 'int', default: 2 })
  priority!: IssuePriority;

  @Column({ name: 'screenshot_url', type: 'text', nullable: true })
  screenshotUrl?: string;

  @Column({ name: 'screenshot_data', type: 'text', nullable: true })
  screenshotData?: string;

  @Column({ name: 'page_path', type: 'varchar', length: 255, nullable: true })
  pagePath?: string;

  @Column({ name: 'linear_issue_id', type: 'varchar', length: 100, nullable: true })
  linearIssueId?: string;

  @Column({ name: 'linear_issue_url', type: 'varchar', length: 500, nullable: true })
  linearIssueUrl?: string;

  @Column({ type: 'json', nullable: true })
  labels?: string[];

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  createdBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

