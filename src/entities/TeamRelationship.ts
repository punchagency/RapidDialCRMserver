import {
 Entity,
 PrimaryGeneratedColumn,
 Column,
 CreateDateColumn,
 UpdateDateColumn,
 ManyToOne,
 JoinColumn,
} from 'typeorm';

@Entity('team_relationships')
export class TeamRelationship {
 @PrimaryGeneratedColumn('uuid')
 id!: string;

 @Column({ name: 'inside_rep_id', type: 'varchar' })
 insideRepId!: string;

 @Column({ name: 'field_rep_id', type: 'varchar', nullable: true })
 fieldRepId?: string;

 @Column({ name: 'manager_id', type: 'varchar', nullable: true })
 managerId?: string;

 @CreateDateColumn({ name: 'created_at' })
 createdAt!: Date;

 @UpdateDateColumn({ name: 'updated_at' })
 updatedAt!: Date;

 // Relations - using string reference to avoid circular dependency
 @ManyToOne('User', 'teamRelationships')
 @JoinColumn({ name: 'inside_rep_id' })
 insideRep?: any;

 @ManyToOne('FieldRep', 'teamRelationships')
 @JoinColumn({ name: 'field_rep_id' })
 fieldRep?: any;

 @ManyToOne('User', 'managedTeamRelationships')
 @JoinColumn({ name: 'manager_id' })
 manager?: any;
}

