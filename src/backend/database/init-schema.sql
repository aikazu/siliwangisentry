-- Siliwangi Sentry - PostgreSQL Initial Schema
-- Based on ARCHITECTURE.MD Section 2.5.4

-- Create ENUM types if they are to be used early, otherwise use VARCHAR and refine later.
-- For simplicity in this initial script, VARCHAR is used as noted in ARCHITECTURE.MD.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- For uuid_generate_v4()

-- 1. workspaces table (if a dedicated table is used)
CREATE TABLE IF NOT EXISTS workspaces (
    workspace_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. assets table
CREATE TABLE IF NOT EXISTS assets (
    asset_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    value TEXT NOT NULL,
    tags TEXT[],
    source VARCHAR(255),
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    attributes JSONB,
    CONSTRAINT unique_asset_in_workspace UNIQUE (workspace_id, type, value)
);
CREATE INDEX IF NOT EXISTS idx_assets_workspace_id_type_value ON assets (workspace_id, type, value);
CREATE INDEX IF NOT EXISTS idx_assets_tags ON assets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_assets_source ON assets (source);

-- 4. scans_metadata table (Create before tool_runs and findings due to FK constraints)
CREATE TABLE IF NOT EXISTS scans_metadata (
    scan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    scan_name VARCHAR(255),
    scan_type VARCHAR(50) NOT NULL, -- e.g., RECON, VULN_SCAN
    trigger_type VARCHAR(30) NOT NULL, -- e.g., MANUAL, SCHEDULED
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- e.g., PENDING, RUNNING, COMPLETED, FAILED
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    parameters JSONB,
    user_id UUID, -- Assuming a users table might exist later for user who initiated
    description TEXT
);
CREATE INDEX IF NOT EXISTS idx_scans_metadata_workspace_id_status ON scans_metadata (workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_scans_metadata_scan_type ON scans_metadata (scan_type);
CREATE INDEX IF NOT EXISTS idx_scans_metadata_trigger_type ON scans_metadata (trigger_type);
CREATE INDEX IF NOT EXISTS idx_scans_metadata_user_id ON scans_metadata (user_id);

-- 5. tool_runs table
CREATE TABLE IF NOT EXISTS tool_runs (
    tool_run_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    scan_id UUID NOT NULL REFERENCES scans_metadata(scan_id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    tool_version VARCHAR(50),
    docker_image VARCHAR(255),
    command_line TEXT,
    parameters JSONB,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- e.g., PENDING, RUNNING, COMPLETED, FAILED
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    log_path TEXT,
    configuration JSONB
);
CREATE INDEX IF NOT EXISTS idx_tool_runs_workspace_id_scan_id ON tool_runs (workspace_id, scan_id);
CREATE INDEX IF NOT EXISTS idx_tool_runs_tool_name ON tool_runs (tool_name);
CREATE INDEX IF NOT EXISTS idx_tool_runs_status ON tool_runs (status);

-- 3. findings table
CREATE TABLE IF NOT EXISTS findings (
    finding_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(asset_id) ON DELETE SET NULL, -- Can be NULL if not asset-specific
    tool_run_id UUID NOT NULL REFERENCES tool_runs(tool_run_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- e.g., VULNERABILITY, MISCONFIGURATION
    title TEXT NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL, -- e.g., CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- e.g., OPEN, CLOSED, ACCEPTED_RISK
    confidence VARCHAR(20), -- e.g., HIGH, MEDIUM, LOW
    cwe_id INTEGER,
    cve_id VARCHAR(30),
    cvss_score DECIMAL(3,1),
    cvss_vector VARCHAR(100),
    remediation_guidance TEXT,
    evidence JSONB,
    tags TEXT[],
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    additional_properties JSONB
);
CREATE INDEX IF NOT EXISTS idx_findings_workspace_id_asset_id ON findings (workspace_id, asset_id);
CREATE INDEX IF NOT EXISTS idx_findings_tool_run_id ON findings (tool_run_id);
CREATE INDEX IF NOT EXISTS idx_findings_type ON findings (type);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings (severity);
CREATE INDEX IF NOT EXISTS idx_findings_status ON findings (status);
CREATE INDEX IF NOT EXISTS idx_findings_cve_id ON findings (cve_id);
CREATE INDEX IF NOT EXISTS idx_findings_cwe_id ON findings (cwe_id);
CREATE INDEX IF NOT EXISTS idx_findings_tags ON findings USING GIN(tags);

-- Default workspace entry (optional, can be created by application logic)
-- INSERT INTO workspaces (name, description) VALUES ('default', 'Default Siliwangi Sentry Workspace') ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE workspaces IS 'Stores information about different workspaces if multi-tenancy or separation is needed.';
COMMENT ON TABLE assets IS 'Represents discoverable targets or pieces of infrastructure.';
COMMENT ON TABLE scans_metadata IS 'Information about a specific scan execution or workflow instance.';
COMMENT ON TABLE tool_runs IS 'Information about a single tool execution within a scan.';
COMMENT ON TABLE findings IS 'Represents a specific security issue, weakness, or piece of information identified by a tool.';

-- Reminder: ENUM types should be considered for fields like type, severity, status for better data integrity later.
-- Example for creating an ENUM type (do this before table creation if used):
-- CREATE TYPE finding_severity_enum AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL');
-- And then use `severity finding_severity_enum NOT NULL,` in the table definition. 