# Siliwangi Sentry - Technology Stack & Tooling

This document outlines the core technologies used to build the Siliwangi Sentry platform and the initial curated list of FOSS security tools that will be integrated.

## 1. Core Platform Technologies

-   **Backend**: Node.js with NestJS Framework (TypeScript)
-   **Frontend**: Vue.js with Tailwind CSS (JavaScript/TypeScript)
-   **Orchestration Engine**: Prefect Core (Python)
-   **Relational Database**: PostgreSQL (latest stable)
-   **Search & Analytics Database**: OpenSearch (latest stable)
-   **Containerization**: Docker & Docker Compose

(See `DECISIONS.MD` D001 & D002 for rationale)

## 2. Integrated FOSS Security Tooling Ecosystem (Initial Set - T009)

This section lists the initial set of FOSS security tools planned for integration. Versions specified are target versions and may be updated based on stability and compatibility during implementation. The primary source for images will be official Docker Hub repositories where available.

**Tooling Categories based on `idea.md`:**

### 2.1. Reconnaissance & Asset Discovery

| Tool Name      | Docker Image Target                       | Purpose                                       |
|----------------|-------------------------------------------|-----------------------------------------------|
| Subfinder      | `projectdiscovery/subfinder:latest`       | Subdomain enumeration                         |
| Amass          | `caffix/amass:latest`                     | In-depth DNS enumeration, network mapping     |
| HTTPX          | `projectdiscovery/httpx:latest`           | Fast HTTP/HTTPS probing, tech detection       |
| Naabu          | `projectdiscovery/naabu:latest`           | Fast port scanning                            |
| WhatWeb        | `ethicalhack3r/whatweb:latest`            | Website technology identification             |
| Aquatone       | `michenriksen/aquatone:latest`            | Visual inspection of websites on many hosts   |
| Dirsearch      | `ethicalhack3r/dirsearch:latest`          | Web path scanning                             |
| Gitleaks       | `zricethezav/gitleaks:latest`             | Git repository secret scanning                |

### 2.2. Vulnerability Scanning & Analysis

| Tool Name      | Docker Image Target                       | Purpose                                       |
|----------------|-------------------------------------------|-----------------------------------------------|
| Nuclei         | `projectdiscovery/nuclei:latest`          | Template-based vulnerability scanning         |
| Nmap           | `instrumentisto/nmap:latest`              | Network scanning, NSE script execution        |
| OWASP ZAP      | `owasp/zap2docker-stable:latest`          | Dynamic Application Security Testing (DAST)   |
| WPScan         | `wpscanteam/wpscan:latest`                | WordPress vulnerability scanner               |
| Trivy          | `aquasec/trivy:latest`                    | Container image vulnerability scanning        |
| tfsec          | `aquasec/tfsec:latest`                    | Terraform IaC security scanning               |

### 2.3. (Optional & Controlled) Exploitation & Validation

| Tool Name          | Docker Image Target                   | Purpose                                       |
|--------------------|---------------------------------------|-----------------------------------------------|
| Metasploit Framework| `metasploitframework/metasploit-framework:latest` | Vulnerability validation & exploitation       |

**Notes on Tool Integration:**

*   Tool versions will be pinned to specific tags (e.g., `vX.Y.Z`) during actual implementation rather than relying solely on `:latest` for stability, once initial compatibility is confirmed.
*   The `GenericRunToolTask` in the Orchestration Engine will be configured to use these Docker images.
*   Configurations for these tools will be managed in `/workspace/tool_configs/TOOL_NAME/` as per `DECISIONS.MD D004`.
*   The `general_tool_settings.json` may contain default parameters applicable to categories or specific tools here (see `DECISIONS.MD D005`).

This list will be expanded as the platform evolves. 