import { Asset } from '../../assets/entities/asset.entity';
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
} from 'typeorm';

@Entity('findings')
export class Finding {
  @PrimaryGeneratedColumn('uuid')
  finding_id: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.findings, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ type: 'uuid' })
  workspace_id: string;

  @ManyToOne(() => Asset, (asset) => asset.findings, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ type: 'uuid', nullable: true })
  asset_id: string;

  @ManyToOne(() => ToolRun, (toolRun) => toolRun.findings, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tool_run_id' })
  tool_run: ToolRun;

  @Column({ type: 'uuid' })
  tool_run_id: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // Consider ENUM type

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20 })
  severity: string; // Consider ENUM type

  @Column({ type: 'varchar', length: 30, default: 'OPEN' })
  status: string; // Consider ENUM type

  @Column({ type: 'varchar', length: 20, nullable: true })
  confidence: string; // Consider ENUM type

  @Column({ type: 'integer', nullable: true })
  cwe_id: number;

  @Column({ type: 'varchar', length: 30, nullable: true })
  cve_id: string;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  cvss_score: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cvss_vector: string;

  @Column({ type: 'text', nullable: true })
  remediation_guidance: string;

  @Column({ type: 'jsonb', nullable: true })
  evidence: any;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  first_seen: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  last_seen: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  reported_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  additional_properties: any;
} 