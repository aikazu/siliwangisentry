import { ToolRun } from '../../tool-runs/entities/tool-run.entity';
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
} from 'typeorm';

@Entity('scans_metadata')
export class ScanMetadata {
  @PrimaryGeneratedColumn('uuid')
  scan_id: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.scans, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ type: 'uuid' })
  workspace_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  scan_name: string;

  @Column({ type: 'varchar', length: 50 })
  scan_type: string; // Consider ENUM type

  @Column({ type: 'varchar', length: 30 })
  trigger_type: string; // Consider ENUM type

  @Column({ type: 'varchar', length: 30, default: 'PENDING' })
  status: string; // Consider ENUM type

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  start_time: Date;

  @Column({ type: 'timestamptz', nullable: true })
  end_time: Date;

  @Column({ type: 'jsonb', nullable: true })
  parameters: any;

  @Column({ type: 'uuid', nullable: true }) // Assuming a users table might exist later
  user_id: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @UpdateDateColumn({ type: 'timestamptz' }) // To track updates to scan metadata itself
  updated_at: Date;

  @OneToMany(() => ToolRun, (toolRun) => toolRun.scan_metadata)
  tool_runs: ToolRun[];
} 