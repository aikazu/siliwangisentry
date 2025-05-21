import { Finding } from '../../findings/entities/finding.entity';
import { ScanMetadata } from '../../scans/entities/scan-metadata.entity';
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

@Entity('tool_runs')
export class ToolRun {
  @PrimaryGeneratedColumn('uuid')
  tool_run_id: string;

  // Relation to Workspace (though not directly in DB schema, useful for ORM queries if needed)
  // This implies that a ToolRun is always within the context of a Workspace via its ScanMetadata.
  // For direct DB queries, workspace_id is on scans_metadata.
  @ManyToOne(() => Workspace, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace; // This will be populated via the scan_metadata relationship indirectly

  @Column({ type: 'uuid' })
  workspace_id: string; // Explicit column for easier joins if Workspace isn't loaded via Scan

  @ManyToOne(() => ScanMetadata, (scan) => scan.tool_runs, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'scan_id' })
  scan_metadata: ScanMetadata;

  @Column({ type: 'uuid' })
  scan_id: string;

  @Column({ type: 'varchar', length: 100 })
  tool_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tool_version: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  docker_image: string;

  @Column({ type: 'text', nullable: true })
  command_line: string;

  @Column({ type: 'jsonb', nullable: true })
  parameters: any;

  @Column({ type: 'varchar', length: 30, default: 'PENDING' })
  status: string; // Consider ENUM type

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  start_time: Date;

  @Column({ type: 'timestamptz', nullable: true })
  end_time: Date;

  @Column({ type: 'text', nullable: true })
  log_path: string;

  @Column({ type: 'jsonb', nullable: true })
  configuration: any;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Finding, (finding) => finding.tool_run)
  findings: Finding[];
} 