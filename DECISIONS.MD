# Siliwangi Sentry - Decision Log

This document records key technical and design decisions made during the development of the Siliwangi Sentry platform.

## Decision D001: Primary Technology Stack for Core Platform

**Date**: (Placeholder for date of decision)
**Context**: Need to select foundational technologies for the backend, frontend, and primary databases as outlined in `idea.md`.
**Options Considered**:
1.  **Backend**: Python (Flask/Django) vs. **Node.js (NestJS)** vs. Go (Gin)
    -   Python: Mature ecosystem, many security tools are Python-based. Flask is lightweight, Django is full-featured.
    -   Node.js (NestJS): Modern, TypeScript-based, good for API development, large NPM ecosystem, performs well for I/O bound tasks. Good synergy with JavaScript frontend.
    -   Go: Excellent performance, strong concurrency, good for system-level tools.
2.  **Frontend**: React vs. **Vue.js** vs. Angular
    -   React: Large community, component-based, widely used.
    -   Vue.js: Progressive framework, easier learning curve for some, good performance, often cited for developer experience.
    -   Angular: Comprehensive framework, opinionated, good for large applications.
3.  **Relational Database**: MySQL vs. **PostgreSQL**
    -   MySQL: Widely used, mature.
    -   PostgreSQL: More feature-rich (e.g., advanced data types, extensibility), often preferred for complex applications.
4.  **Search/Analytics Database**: Elasticsearch vs. **OpenSearch**
    -   Elasticsearch: Powerful, widely used, but licensing changes (BSL) are a concern for FOSS focus.
    -   OpenSearch: Apache 2.0 licensed fork of Elasticsearch, community-driven, FOSS-aligned.

**Decision**:
-   **Backend**: Node.js with NestJS framework.
-   **Frontend**: Vue.js with Tailwind CSS (as specified in `idea.md`).
-   **Relational Database**: PostgreSQL.
-   **Search/Analytics Database**: OpenSearch.

**Consequences**:
-   Team/developer needs proficiency in TypeScript/JavaScript, Vue.js, PostgreSQL, and OpenSearch.
-   Ensures a modern, performant, and FOSS-aligned core platform.
-   Tailwind CSS choice for frontend implies utility-first CSS approach.
**Status**: ACCEPTED

## Decision D002: Orchestration Engine Choice

**Date**: (Placeholder for date of decision)
**Context**: Need an engine to manage complex scan chains and tool execution sequences as per `idea.md` (Section I & IV).
**Options Considered**:
1.  **Prefect Core**: Python-based, modern data workflow automation, good for ETL and complex DAGs.
2.  **Apache Airflow**: Python-based, widely adopted, feature-rich, can be complex to set up/manage for smaller local deployments.
3.  Custom Solution (e.g., using NestJS workers + BullMQ directly for all orchestration):
    -   Pros: Tighter integration with backend.
    -   Cons: Re-inventing features already available in mature orchestration tools, may lack advanced DAG management, UI for workflow visualization.

**Decision**: Initially lean towards **Prefect Core** due to its modern approach and potentially simpler setup for local single-user deployment compared to Airflow. BullMQ will be used for NestJS backend tasks as specified, but Prefect for the broader tool workflow orchestration.

**Consequences**:
-   Requires Python environment for Prefect.
-   Need to define tool execution as Prefect tasks.
-   Integration between NestJS (submitting jobs) and Prefect (executing them) needs to be designed.
**Status**: PROPOSED (pending further investigation during T003/T020)

## Decision D003: Workspace Resource Synchronization

**Date**: (Placeholder for date of decision)
**Context**: Tools like Nuclei require up-to-date templates, and wordlists like Seclists need to be current. The platform needs a way to manage these within the workspace (`idea.md` Section III).
**Options Considered**:
1.  **Manual Git Pulls by User**: User is responsible for `cd`-ing into `/workspace/nuclei-templates` and running `git pull`.
    -   Pros: Simple, no platform code needed.
    -   Cons: Error-prone, relies on user remembering, not integrated.
2.  **Platform-Triggered Git Operations**: UI button/scheduled task in the platform backend that executes `git pull` commands within the designated workspace subdirectories.
    -   Pros: Integrated, easier for the user.
    -   Cons: Platform needs privileges to execute git, error handling for git commands needed.
3.  **Embedding Git Libraries**: Use a Node.js git library in the backend.
    -   Pros: More programmatic control.
    -   Cons: Adds dependency, might be overkill.

**Decision**: Implement **Platform-Triggered Git Operations** (Option 2) for common resources like Nuclei Templates and Seclists. This provides a balance of integration and simplicity for the user.

**Consequences**:
-   Backend needs a secure way to execute shell commands (git) or use a git library.
-   UI needs elements to trigger these updates and display status.
-   Clear directory structure for these version-controlled resources within the workspace is essential.
**Status**: ACCEPTED

## Decision D004: Schema for Tool Configurations (`tool_configs`)

**Date**: (Placeholder for date of decision)
**Context**: Need a consistent and flexible way to store and manage configurations for various FOSS tools within `/workspace/tool_configs/`. Tools have diverse configuration file formats (YAML, JSON, XML, custom formats).
**Options Considered**:
1.  **Native Format Storage**: Store each tool's configuration in its native format (e.g., `nuclei/config.yaml`, `zap/default.policy`).
    *   Pros: Tools can use them directly. No translation layer needed by the platform when passing configs to tools. Users familiar with the tools can easily understand/edit.
    *   Cons: Platform UI for managing these configs might be complex if it tries to parse/understand all native formats. Generic settings across tools are harder to manage.
2.  **Standardized JSON/YAML Wrapper**: Define a common JSON or YAML structure for Siliwangi Sentry to manage tool configurations. The platform would then translate this into the tool's native format before execution if necessary, or tools are configured to read a generic format if possible.
    *   Pros: Easier for the UI to present a consistent configuration experience. Can define common metadata (e.g., `description`, `creationDate`, `author`).
    *   Cons: May require writing translators for many tools. Some complex tool-specific configurations might be hard to represent generically.
3.  **Hybrid Approach**: Store native files directly (Option 1) but accompany them with a separate metadata file (e.g., `nuclei/config.yaml.meta.json`) that describes the configuration, provides a user-friendly name, version, etc. for UI purposes. Also, use a `general_tool_settings.json` for overarching parameters.
    *   Pros: Combines direct usability of native configs with UI-friendly metadata. Allows platform to manage/display configs without needing to fully parse them. The `general_tool_settings.json` (as proposed in `ARCHITECTURE.MD [ws-mgmt-detail]`) can handle common cross-tool parameters.
    *   Cons: Two files per significant configuration. Metadata needs to be kept in sync if native files are edited manually.

**Decision**: Adopt the **Hybrid Approach (Option 3)**.
-   Tool configurations will be stored primarily in their **native formats** within `/workspace/tool_configs/TOOL_NAME/config_file.ext`.
-   The platform can optionally use/generate a companion `*.meta.json` file for richer UI display and management if needed (e.g. for descriptions, tags, user-friendly names).
-   A `general_tool_settings.json` file at `/workspace/tool_configs/general_tool_settings.json` will be used for platform-wide or common tool settings (e.g., default output verbosity, concurrency settings for certain tool categories) that tools can be made aware of or the orchestration engine can use.
-   The UI will primarily act as a file manager for these configurations, allowing users to upload, download, edit (as text), and organize them. Advanced parsing/validation for specific tools in the UI will be a progressive enhancement.

**Consequences**:
-   Simplifies the core requirement of getting configurations to tools.
-   The UI development for config management is initially simpler (file management focus).
-   The orchestrator/tool wrappers will need to know how to point tools to these native configuration files.
-   The structure of `general_tool_settings.json` needs to be defined.
-   Future work might involve developing schemas or UI components for popular tools to edit their native configs more intuitively.

**Status**: ACCEPTED

## Decision D005: Structure for `general_tool_settings.json`

**Date**: (Placeholder for date of decision)
**Context**: Following D004, a `general_tool_settings.json` file is planned for `/workspace/tool_configs/` to hold platform-wide or common tool settings. Its structure needs to be defined.
**Options Considered for Structure**:
1.  **Flat Key-Value Structure**: Simple key-value pairs for all settings.
    *   Pros: Very simple to parse.
    *   Cons: Can become cluttered; no logical grouping of settings.
2.  **Category-Based Nested Structure**: Group settings by category (e.g., `common`, `reconnaissance`, `scanning`) or by tool type.
    *   Pros: Better organization, easier to find relevant settings, more extensible.
    *   Cons: Slightly more complex to parse/navigate.
3.  **Tool-Specific Overrides within General Settings**: Allow a general settings section and then tool-specific sections that can override or add to the general ones.
    *   Pros: Flexible; allows general defaults and specific tweaks.
    *   Cons: Could lead to confusion if overrides are not clear; similar to individual tool configs but centralized.

**Decision**: Adopt a **Category-Based Nested Structure (Option 2)** for `general_tool_settings.json`. This provides a good balance of organization and accessibility. The initial categories will be kept simple and can be expanded as needed.

**Proposed Initial Structure for `/workspace/tool_configs/general_tool_settings.json`**:
```json
{
  "global": {
    "defaultTimeoutSeconds": 3600, // Default timeout for individual tool executions
    "defaultVerbosity": "medium", // low, medium, high
    "maxConcurrentTools": 5      // Max tools the orchestrator runs in parallel
  },
  "reconnaissance": {
    "subdomainEnumeration": {
      "defaultWordlist": "/workspace/shared_resources/seclists/Discovery/DNS/subdomains-top1million-5000.txt",
      "usePassiveOnly": false
    },
    "portScanning": {
      "defaultScanType": "TCP_SYN", // TCP_SYN, TCP_CONNECT, UDP
      "defaultPorts": "top-1000" // Or specific comma-separated list
    }
  },
  "vulnerabilityScanning": {
    "nuclei": {
      "defaultSeverity": "critical,high,medium",
      "defaultTemplateFilters": [] // e.g., ["tags:cve", "-tags:dos"]
    },
    "dast": {
      "defaultAttackStrength": "medium"
    }
  },
  "reporting": {
    "defaultAuthor": "Siliwangi Sentry Platform",
    "includeToolOutputInReport": false
  }
  // More categories and settings can be added later e.g. for specific tool families
}
```

**Consequences**:
-   The backend and orchestration engine will need to be able to parse this structure.
-   The UI could potentially allow editing these general settings.
-   Specific tools or tool wrappers might need to be adapted to accept these general parameters if they don't have their own more specific config file in `/workspace/tool_configs/TOOL_NAME/`.
-   Clear documentation will be needed for users to understand these settings.

**Status**: ACCEPTED

_More decisions will be logged here as the project progresses._ 