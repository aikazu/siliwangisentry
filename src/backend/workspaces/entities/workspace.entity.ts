import { Asset } from '../../assets/entities/asset.entity';
import { Finding } from '../../findings/entities/finding.entity';
import { ScanMetadata } from '../../scans/entities/scan-metadata.entity';
import { ToolRun } from '../../tool-runs/entities/tool-run.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  workspace_id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Asset, (asset) => asset.workspace)
  assets: Asset[];

  @OneToMany(() => ScanMetadata, (scan) => scan.workspace)
  scans: ScanMetadata[];

  @OneToMany(() => Finding, (finding) => finding.workspace)
  findings: Finding[];

  @OneToMany(() => ToolRun, (toolRun) => toolRun.workspace)
  tool_runs: ToolRun[];
} 