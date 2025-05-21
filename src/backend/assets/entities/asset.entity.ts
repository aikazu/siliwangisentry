import { Finding } from '../../findings/entities/finding.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';

@Entity('assets')
@Index(['workspace', 'type', 'value'], { unique: true })
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  asset_id: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.assets, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ type: 'uuid' })
  workspace_id: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // Consider creating a PostgreSQL ENUM type later

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  source: string;

  @CreateDateColumn({ type: 'timestamptz' })
  first_seen: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  last_seen: Date;

  @Column({ type: 'jsonb', nullable: true })
  attributes: any;

  @OneToMany(() => Finding, (finding) => finding.asset)
  findings: Finding[];
} 