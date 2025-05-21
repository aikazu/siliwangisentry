# Siliwangi Sentry

Siliwangi Sentry is an advanced, automated penetration testing and security platform with a focus on Free and Open-Source Software (FOSS). It is designed for single-user, local deployment, emphasizing workspace-centric resource management and minimizing external dependencies. The platform aims to automate significant portions of the penetration testing lifecycle, from reconnaissance to reporting, providing actionable insights through a centralized dashboard.

## Features

- Workspace-centric resource management for tools, configurations, and data.
- Automated execution of FOSS security tools in isolated environments.
- Centralized dashboard for scan management, vulnerability tracking, and reporting.
- Modular architecture allowing for extensibility.
- Focus on local operation and data privacy.

## Quick Start

```bash
# Installation (Details TBD)
# Prerequsites: Docker, Node.js, Python
echo "Detailed installation steps will be provided here."

# Run development server (Details TBD)
echo "Instructions to run the platform will be provided here."
```

## Documentation

- [TASK.MD](TASK.MD) - Current tasks, backlog, and progress.
- [STATE.MD](STATE.MD) - System state snapshots and checkpoints.
- [ARCHITECTURE.MD](ARCHITECTURE.MD) - System design, components, and interaction flows.
- [DECISIONS.MD](DECISIONS.MD) - Log of key technical and design decisions.
- `API-SPECS.md` (Future) - API documentation.
- `TESTING.md` (Future) - Testing strategy and cases.
- `TECH-STACK.md` (Future) - Technology stack details.

## Development Environment

- OS: User's OS (e.g., Windows with WSL2, Linux, macOS)
- Terminal: User's preferred terminal
- Editor: User's preferred editor (e.g., VS Code, Cursor)
- Key Technologies: Docker, Node.js (NestJS), Vue.js, PostgreSQL, OpenSearch, Python (for orchestration or specific tools)

## License

To be determined (Likely a permissive FOSS license like MIT or Apache 2.0).

## Database Initialization

When running the platform for the first time using `docker-compose up -d`, the databases will be set up as follows:

### PostgreSQL

- The PostgreSQL service defined in `docker-compose.yml` will automatically create the `siliwangi_db` database, `siliwangi_user` user, and set the password.
- The schema (tables, indexes) as defined in `src/backend/database/init-schema.sql` will be automatically applied when the database is initialized for the first time. This is handled by mounting the SQL script into the `/docker-entrypoint-initdb.d/` directory of the PostgreSQL container.
- No further manual steps are typically required for PostgreSQL schema setup on initial run.

### OpenSearch

- The OpenSearch service will start, and its data will be persisted in a Docker volume.
- The necessary index (`siliwangi_findings`) and its mapping need to be created manually after OpenSearch is running. You can use the following `curl` command targeting the OpenSearch API. It's best to wait until OpenSearch is healthy (check `docker-compose logs opensearch` or its healthcheck status).

**Create `siliwangi_findings` index with mapping:**

Make sure `src/backend/opensearch/mappings/siliwangi_findings_mapping.json` exists and is accessible.

```bash
curl -X PUT "http://localhost:9200/siliwangi_findings" -H "Content-Type: application/json" -d @src/backend/opensearch/mappings/siliwangi_findings_mapping.json
```

Alternatively, if you are running this command from a location where the JSON file path `@src/...` might not resolve correctly with `curl`, you can paste the content of the JSON file directly:

```bash
curl -X PUT "http://localhost:9200/siliwangi_findings" -H "Content-Type: application/json" -d '
{
  "mappings": {
    "properties": {
      "finding_id": { "type": "keyword" },
      "workspace_id": { "type": "keyword" },
      "title": {
        "type": "text",
        "fields": {
          "keyword": { "type": "keyword", "ignore_above": 256 }
        }
      },
      "description": { "type": "text" },
      "type": { "type": "keyword" },
      "severity": { "type": "keyword" },
      "status": { "type": "keyword" },
      "confidence": { "type": "keyword" },
      "cwe_id": { "type": "integer" },
      "cve_id": { "type": "keyword" },
      "cvss_score": { "type": "float" },
      "cvss_vector": { "type": "keyword" },
      "remediation_guidance": { "type": "text" },
      "evidence_summary": { "type": "text" }, 
      "tags": { "type": "keyword" },
      "first_seen": { "type": "date" },
      "last_seen": { "type": "date" },
      "reported_at": { "type": "date" },
      "additional_properties": { "type": "object", "dynamic": true },
      "asset": {
        "type": "object",
        "properties": {
          "asset_id": { "type": "keyword" },
          "type": { "type": "keyword" },
          "value": {
            "type": "text",
            "fields": {
              "keyword": { "type": "keyword", "ignore_above": 1024 } 
            }
          },
          "tags": { "type": "keyword" },
          "attributes": { "type": "object", "dynamic": true }
        }
      },
      "tool_run": {
        "type": "object",
        "properties": {
          "tool_run_id": { "type": "keyword" },
          "tool_name": { "type": "keyword" },
          "tool_version": { "type": "keyword" },
          "command_line": { "type": "text", "index": false } 
        }
      },
      "scan": {
        "type": "object",
        "properties": {
          "scan_id": { "type": "keyword" },
          "scan_name": {
            "type": "text",
            "fields": {
              "keyword": { "type": "keyword", "ignore_above": 256 }
            }
          },
          "scan_type": { "type": "keyword" }
        }
      }
    }
  }
}
'
```

This step only needs to be done once for setting up the index. Subsequent runs of `docker-compose up` will use the persisted OpenSearch data volume.

*(This section should be reviewed and updated if application-level bootstrapping for databases is implemented in the backend.)*

## Contribution Guidelines

Details to be provided if the project becomes open for public contributions. 