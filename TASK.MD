# Siliwangi Sentry - Task Plan

## Session Focus
Currently working on: T007 - Develop Web Dashboard (Backend - NestJS)
- [x] Initialize/verify NestJS project structure for backend (`src/backend`) (incl. dependencies, TypeORM & OpenSearch client setup)
- [x] Create core modules (e.g., `WorkspacesModule`, `AssetsModule`, `ScansModule`, `FindingsModule`, `ToolRunsModule`)
- [x] Define DTOs (Data Transfer Objects) for API requests/responses for these modules
- [ ] Implement basic CRUD services for main entities (TypeORM Entities created, modules configured; services next)
- [ ] Setup initial API controllers and endpoints (as outlined conceptually in `ARCHITECTURE.MD` for workspace, and extend for other entities)
- [ ] Implement basic OpenSearch interaction service (e.g., for indexing findings)

## Task Tracker

| ID    | Description                                     | Priority | Status      | Dependencies | Progress |
|-------|-------------------------------------------------|----------|-------------|--------------|----------|
| **I. Platform Architecture**                            |          |             |              |          |
| T001  | Initial Project Setup and Documentation Framework | HIGH     | COMPLETED   | -            | 100%     |
| T002  | Define Workspace Management System              | HIGH     | COMPLETED   | T001         | 100%     |
| T003  | Design Orchestration Engine                     | HIGH     | COMPLETED   | T002         | 100%     |
| T004  | Specify Tool Execution Environment (Docker)     | HIGH     | COMPLETED   | T002, T003   | 100%     |
| T005  | Design Data Aggregation & Correlation Layer     | MEDIUM   | COMPLETED   | T003         | 100%     |
| T006  | Setup Database Backend (PostgreSQL & OpenSearch)| HIGH     | COMPLETED   | T005         | 100%     |
| T007  | Develop Web Dashboard (Backend - NestJS)        | HIGH     | TODO        | T006         | 0%       |
| T008  | Develop Web Dashboard (Frontend - Vue.js)       | HIGH     | TODO        | T007         | 0%       |
| T009  | Curate Initial Tooling Ecosystem List           | MEDIUM   | COMPLETED   | T001         | 100%     |
| T010  | Design Notification & Reporting Module          | MEDIUM   | TODO        | T007         | 0%       |
| **II. Enhanced FOSS Toolchain**                       |          |             |              |          |
| T011  | Integrate Reconnaissance & Asset Discovery Tools| HIGH     | TODO        | T004, T009   | 0%       |
| T012  | Integrate Vulnerability Scanning & Analysis Tools| HIGH    | TODO        | T004, T009   | 0%       |
| T013  | Integrate (Optional) Exploitation Tools         | LOW      | TODO        | T004, T009   | 0%       |
| **III. Centralized Dashboard Features**                 |          |             |              |          |
| T014  | Implement Asset Management Feature              | HIGH     | TODO        | T008, T005   | 0%       |
| T015  | Implement Scan Management Feature               | HIGH     | TODO        | T008, T003   | 0%       |
| T016  | Implement Vulnerability Management Feature      | HIGH     | TODO        | T008, T005   | 0%       |
| T017  | Implement Reporting & Analytics Feature         | MEDIUM   | TODO        | T008, T010   | 0%       |
| T018  | Implement Workspace Resource Management UI      | MEDIUM   | TODO        | T008, T002   | 0%       |
| T019  | Implement Platform Configuration UI             | MEDIUM   | TODO        | T008         | 0%       |
| **IV. Automation, Chaining & Orchestration**          |          |             |              |          |
| T020  | Implement Workflow Engine (Prefect/Airflow)     | HIGH     | TODO        | T003, T004   | 0%       |
| T021  | Implement Backend Task Management (BullMQ)      | MEDIUM   | TODO        | T007         | 0%       |
| T022  | Define Standardized Data Flow                   | MEDIUM   | TODO        | T005         | 0%       |
| **V. Reporting & Notifications**                      |          |             |              |          |
| T023  | Implement Local Desktop Notifications           | LOW      | TODO        | T010         | 0%       |
| T024  | Implement Report File Generation (HTML, PDF, JSON)| MEDIUM | TODO        | T010         | 0%       |
| T025  | Implement Customizable Alert Triggers           | LOW      | TODO        | T010         | 0%       |
| T026  | Implement Scheduled Report Generation           | LOW      | TODO        | T010, T020   | 0%       |
| T027  | Design Optional Local API for Integration       | LOW      | TODO        | T007         | 0%       |
| **VI. Advanced Implementation Considerations**        |          |             |              |          |
| T028  | Define Detailed Workspace Directory Structure   | HIGH     | COMPLETED   | T002         | 100%     |
| T029  | Implement Docker Compose for Services & Tools   | HIGH     | TODO        | T004, T006, T007 | 0%       |
| T030  | Implement Resource Management (CPU, mem, disk)  | MEDIUM   | TODO        | T003, T008   | 0%       |
| T031  | Implement Robust Error Handling & Logging       | MEDIUM   | TODO        | T007, T003   | 0%       |
| T032  | Setup Secure API Key/Credentials Storage (Vault)| LOW      | TODO        | -            | 0%       |
| T033  | Implement Tool & Resource Update Mechanisms     | MEDIUM   | TODO        | T002, T004   | 0%       |
| T034  | Implement Versioning for Tool Configs           | LOW      | TODO        | T002         | 0%       |
| T035  | Design for Custom Scan Workflows & Scripts      | MEDIUM   | TODO        | T003, T015   | 0%       |
| T036  | Implement Legal & Ethical Usage Disclaimer in UI| HIGH     | TODO        | T008         | 0%       |

## Completed Tasks

| ID    | Description        | Completed | Notes                    |
|-------|--------------------|-----------|--------------------------|
| -     | Project idea phase | ✓         | `idea.md` created        | 