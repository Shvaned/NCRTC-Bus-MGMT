# NCRTC Bus Management System (BMS)

**Enterprise-grade bus fleet operations platform for the National Capital Region Transport Corporation.**

A full-stack, production-style modular monolith built with Next.js 16, TypeScript, PostgreSQL/PostGIS, and Docker — covering live vehicle tracking, crew scheduling, incident management, notice communications, and executive analytics.

<p align="left">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PostGIS-3.4-green?logo=postgresql" alt="PostGIS" />
  <img src="https://img.shields.io/badge/Prisma-7-indigo?logo=prisma" alt="Prisma 7" />
  <img src="https://img.shields.io/badge/Auth.js-v5-8b5cf6?logo=auth0" alt="Auth.js v5" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/GitHub_Actions-CI-2088FF?logo=githubactions" alt="CI" />
  <img src="https://img.shields.io/badge/License-Internal-8B0000" alt="Internal" />
</p>

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [System Architecture](#system-architecture)
5. [Key Architectural Decisions](#key-architectural-decisions)
6. [Necessary Assumptions](#necessary-assumptions)
7. [Website Access & Demo Credentials](#website-access--demo-credentials)
8. [How to Run Locally](#how-to-run-locally)
9. [Deployment Options](#deployment-options)
10. [Project Structure](#project-structure)
11. [API Architecture](#api-architecture)
12. [Security Considerations](#security-considerations)
13. [Demo Flow for Reviewers](#demo-flow-for-reviewers)
14. [Future Improvements](#future-improvements)
15. [Known Limitations](#known-limitations)

---

## Project Overview

### The Problem

NCRTC operates bus fleets across multiple depots in the Delhi NCR region. Before this system, operations were fragmented across:

- **Manual crew scheduling** — paper-based duty rosters, no conflict detection
- **Delayed incident response** — no centralized panic mechanism, no audit trail
- **No fleet visibility** — controllers could not see where buses were in real time
- **Siloed communications** — notices pinned to depot boards, no read receipts
- **No data-driven oversight** — executives had no aggregated fleet performance view

### What This Platform Solves

The NCRTC BMS replaces all of the above with a **single integrated platform** that gives every stakeholder — from drivers to executives — exactly the tools and information they need, scoped to their role and depot:

| Stakeholder | What They Get |
|-------------|---------------|
| **System Admin** | Full system configuration, route management, user oversight |
| **Control Room Operator** | Live 50-vehicle map, incident command center, fleet-wide visibility |
| **Depot Manager** | Weekly roster planner, duty assignment, depot-scoped fleet tracking |
| **Driver** | Mobile-first duty view with acknowledgement, notice reader, panic button |
| **Conductor** | Duty schedule view, incident reporting |
| **Executive** | Fleet utilization charts, incident breakdowns, depot performance analytics |

---

## Key Features

### Authentication & RBAC

Six fixed roles — admin, control_operator, depot_manager, driver, conductor, executive — each with a permission map. Permission checks use `hasPermission(role, permission)` — no hardcoded role checks anywhere in the codebase. Depot-scoped roles are restricted to their assigned depot at the repository layer. JWT tokens carry `userId`, `role`, `depotId`, and `organizationId` in claims for zero-database middleware validation.

### Scheduling — Routes, Duties & Rosters

Route builder with ordered stop sequencing (add/remove/reorder). Weekly roster displayed as a **driver × day grid** — click any cell to open an assignment drawer and set driver, vehicle, route, and shift time. Conflict detection prevents the same driver or vehicle from being double-booked. Duties follow a publish lifecycle: `DRAFT → PUBLISHED → ACKNOWLEDGED → COMPLETED`. Publishing creates in-app notifications for affected drivers.

### AVLS — Live Vehicle Tracking

**Hero feature.** A 70/30 map-panel command center showing all active buses on an OpenStreetMap layer via Leaflet. Vehicle positions update every 5 seconds through TanStack Query polling. Markers are color-coded by status (green = active, grey = idle, amber = off-route). Clicking a marker opens a detail drawer showing speed, heading, depot, driver, and the last 30 minutes of GPS trail drawn as a polyline. A full-day GPS history view renders the entire day's path with trip session summaries. Depot filtering and vehicle search are built into the top bar.

### GPS Simulation Engine

A standalone Node.js process (`src/scripts/tick.ts`) runs every 5 seconds. It finds vehicles with active published duties, interpolates their position along the assigned route's stop sequence, applies realistic behavior (speed variation, slowdown near stops, GPS jitter), and writes `gps_ping` records + updates `vehicle_live_state`. The simulation is architecturally swappable — a real GPS ingest pipeline would write to the same tables.

### IMS — Incident Management System

Full lifecycle: `OPEN → ACKNOWLEDGED → IN_PROGRESS → RESOLVED → CLOSED`. Every status transition requires a mandatory note. Incidents are priority-sorted (P1/P2/P3) with P1 criticals highlighted in red with a pulsing indicator. The command center table supports filtering by status, severity, type, depot, and free-text search. Each incident has a vertical timeline showing every status change, assignment, and note. Vehicle-linked incidents can jump directly to the AVLS history view.

### Panic Workflow

Drivers access `/driver/panic` — a dedicated screen with a large red button. To prevent accidental triggers, the button requires a **2.5-second hold** (progress bar fills, button scales). On release before 2.5 seconds, the action is cancelled. On successful trigger, the system auto-creates a P1 PANIC incident with the driver's current vehicle, depot, and GPS coordinates. All control room operators and admins receive an in-app notification instantly.

### CMS — Notices & Communications

Admins and operators create notices with **audience targeting** (ALL_DRIVERS, specific DEPOT, or specific ROLE). Notices can require acknowledgement — drivers must explicitly tap "Acknowledge" after reading. The admin dashboard shows read percentages and acknowledgement rates per notice. Drivers see unread notices first with a blue left-border indicator. Publishing a notice creates notifications for all targeted users.

### Driver PWA

The driver experience is mobile-first (320px responsive). A **fixed bottom navigation bar** provides one-tap access to Home, Duty, Notices, Incidents, and Panic. All interactive elements are sized for thumb operation. An offline banner appears when the network drops. A PWA manifest enables install-to-home-screen on supported browsers.

### Executive Dashboard

Recharts-powered analytics with four chart panels: fleet utilization (7-day bar chart), incident breakdown by severity (donut chart), duty completion trend (line chart), and depot performance comparison (horizontal bar chart). A depot filter scopes all charts to a single depot. KPI cards at the top show total fleet, active buses, incidents today, and duty completion rate.

### Reporting Module

Four API endpoints provide aggregated data: daily report (fleet utilization + duty completion trend), incident report (by severity and type), fleet report (totals and percentages), and depot summary (per-depot vehicle/duty/incident counts). All endpoints support optional `?depotId=` filtering.

### Notification Center

A unified notification page (`/notifications`) aggregates alerts from all modules — new duties, published notices, incident assignments, panic alerts, and status updates. The header bell shows a red badge with unread count (refreshes every 30 seconds). Mark-all-read is supported.

### Enterprise UX

- **CMD+K command palette** for global navigation (shadcn command component)
- **Collapsible sidebar** with per-role link resolution (every nav item resolves to an existing page)
- **Dark theme default** via next-themes with `disableTransitionOnChange` for clean hydration
- **Error boundaries** with retry buttons, **loading skeletons** for tables and cards, **empty states** for all data views
- **Sliding drawer** for detail panels, **filter bars** with search and dropdown filters

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router, Turbopack) | Full-stack React with SSR, API routes, file-based routing |
| **Language** | TypeScript 5 | End-to-end type safety |
| **Database** | PostgreSQL 16 + PostGIS 3.4 | Relational storage with spatial indexing for GPS queries |
| **ORM** | Prisma 7 with `@prisma/adapter-pg` | Type-safe queries, declarative schema, migrations, seed |
| **Auth** | Auth.js v5 (Credentials Provider) | JWT sessions with database-backed session tracking |
| **Password Hashing** | bcryptjs (12 rounds) | Secure credential storage |
| **Styling** | TailwindCSS 4 + shadcn/ui (Base UI) | Utility-first CSS with accessible component primitives |
| **Server State** | TanStack Query v5 | Caching, polling, optimistic updates, query invalidation |
| **Client State** | Zustand v5 | UI state (sidebar collapse, mobile menu) |
| **Forms** | React Hook Form + Zod v4 | Form state management with schema validation |
| **Maps** | Leaflet + react-leaflet | Free, offline-capable tile maps via OpenStreetMap |
| **Charts** | Recharts | Composable React charting library |
| **Icons** | Lucide React | Consistent icon set |
| **Toasts** | Sonner | Lightweight toast notifications |
| **Testing** | Vitest + React Testing Library | Fast unit and integration tests |
| **Containerization** | Docker + Docker Compose | Multi-service local environment (app + postgres + tick) |
| **CI** | GitHub Actions | Lint → typecheck → test → build pipeline |
| **Hosting** | Vercel (frontend) + Neon PostgreSQL (database) | Zero-cost deployment for hobby tier |

---

## System Architecture

### Modular Monolith

The application is a **single Next.js deployment** with strict domain boundaries. Each module (`avls/`, `scheduling/`, `ims/`, `cms/`, `reporting/`) follows an identical layered pattern:

```
Controller (API Route handler)
    → Service (business logic, validation, notifications, audit)
        → Repository (Prisma data access)
```

**Why this over microservices:**

- **Single deployment artifact** — one `docker compose up` starts everything
- **Zero inter-service latency** — direct Prisma calls, no network hops
- **Clear extraction path** — module boundaries are enforced by convention and can be physically separated later
- **Operational simplicity** — one process to monitor, one database to back up, one log stream
- **Appropriate scale** — designed for 50-200 vehicles, well within single-node Postgres capacity

### Database Design (27 Models)

- **Core SaaS**: `organization`, `user`, `role`, `permission`, `role_permission`, `user_session`, `audit_log`, `file_upload`, `notification`
- **Fleet**: `depot`, `vehicle`, `vehicle_live_state`, `stop`, `route`, `route_stop`
- **Scheduling**: `duty` (DRAFT→PUBLISHED→ACKNOWLEDGED→COMPLETED→MISSED), `leave_request`
- **AVLS**: `gps_ping`, `trip_gps_session`, `geofence_event`
- **IMS**: `incident` (OPEN→ACKNOWLEDGED→IN_PROGRESS→RESOLVED→CLOSED), `incident_event`, `incident_attachment`, `incident_assignment_history`
- **CMS**: `notice` (DRAFT→PUBLISHED→ARCHIVED), `notice_read`

All tables use UUID primary keys, `created_at`/`updated_at`/`deleted_at` timestamps, and `organization_id` for multi-tenancy readiness.

### Why `vehicle_live_state` Exists

The live map queries `vehicle_live_state` (one row per vehicle, indexed) rather than aggregating `gps_ping` (millions of rows). This keeps the 5-second polling endpoint sub-100ms for 50 vehicles. The tick simulator maintains this table as a write-through cache.

---

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Modular monolith over microservices** | Single deployment, zero network overhead, clear module boundaries for future extraction. Appropriate for the current scale (50-200 vehicles). |
| **Polling (5s) over WebSockets** | Simpler infrastructure, works through proxies and load balancers, no persistent connection management. TanStack Query handles caching and deduplication. WebSockets can be added later without changing the data model. |
| **PostGIS for spatial data** | Enables efficient geospatial queries (proximity, containment, distance). Schema is PostGIS-ready even though current queries use coordinate columns directly — spatial functions are available for future features like geofencing. |
| **JWT role claims in middleware** | Middleware validates the JWT cookie without any database call. `userId`, `role`, `depotId`, and `organizationId` are embedded in the token at login. This keeps middleware fast and Edge-compatible. |
| **Simulated GPS over real hardware** | Enables demos without physical devices. The simulation writes to the same `gps_ping` and `vehicle_live_state` tables that real GPS would use. Swapping to real ingest is a data pipeline change, not an architecture change. |
| **Credentials-only auth over OAuth** | NCRTC drivers and operators do not have corporate Google accounts. Credentials are the correct enterprise pattern for operational staff. OAuth can be added as a secondary provider without removing credentials. |
| **Permission-based RBAC over role checks** | `hasPermission(role, "incident.publish")` instead of `if (role === "admin")`. Adding a new role means updating one permission map, not hunting through every component. |
| **Zero-cost deployment** | Every dependency is free-tier compatible. Vercel Hobby + Neon PostgreSQL + OpenStreetMap tiles + Docker local. No paid APIs, no vendor lock-in. |

---

## Necessary Assumptions

These assumptions were made during development and are documented for reviewer transparency:

| Assumption | Impact |
|------------|--------|
| **GPS data is simulated** | No real hardware integration. The `gps_ping` and `vehicle_live_state` tables are identical to what real devices would produce. A production system would replace the tick script with an MQTT/HTTP ingest pipeline. |
| **Single organization (NCRTC)** | The schema supports multi-tenancy via `organization_id` on all entities, but the seed and UI operate on a single org. Multi-tenant isolation exists at the data layer. |
| **Drivers are pre-onboarded by admins** | No self-registration flow. This matches enterprise fleet reality — drivers are employees assigned by depot managers, not self-signing users. |
| **Panic is in-app only** | Panic triggers create P1 incidents and in-app notifications. No SMS, no push notifications, no external alerting integrations. These can be added as notification channels. |
| **File uploads use local storage** | Incident images go to `/public/uploads`. In production this would move to S3/Cloudflare R2/Supabase Storage. |
| **Polling is acceptable for 50 vehicles** | 5-second map updates are sufficient for operational awareness. Real-time (sub-second) updates would require WebSocket infrastructure. |
| **No CI/CD deployment to Vercel** | The GitHub Actions pipeline validates code (lint, typecheck, test, build) but does not auto-deploy. Vercel deployment is triggered manually or via Vercel's GitHub integration. |

---

## Website Access & Demo Credentials

### Production

```
https://ncrtc-bus-mgmt.vercel.app
```

### Local

```
http://localhost:3000
```

### Demo Credentials

All accounts use password: **`password123`**

| Username | Role | What to Test |
|----------|------|--------------|
| `admin` | System Administrator | Route creation, notice management, full system access, settings |
| `control.operator1` | Control Room Operator | Live fleet map (`/control-room/avls`), incident command center, GPS history |
| `dm.noida` | Depot Manager — Noida Sector 37 | Weekly roster (`/depot/roster`), duty assignment, depot fleet tracking |
| `driver.raj.01` | Driver | Duty acknowledgement, notice reader, panic button, vehicle tracking |
| `conductor.01` | Conductor | Duty schedule, incident reporting |
| `executive1` | Executive | Analytics dashboard with charts, fleet KPIs, depot performance |

---

## How to Run Locally

### Prerequisites

- Node.js 20+
- Docker Desktop
- Git

### Quick Start (Docker — one command)

```bash
git clone https://github.com/Shvaned/NCRTC-Bus-MGMT.git
cd NCRTC-Bus-MGMT
docker compose up --build
```

This starts PostgreSQL 16 + PostGIS, runs Prisma migrations, seeds the database, starts the Next.js app, and launches the GPS tick simulator. Open `http://localhost:3000`.

### Manual Setup (for development)

```bash
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL

# Start PostgreSQL via Docker
docker compose up postgres -d

# Create database tables
npx prisma migrate dev --name init

# Insert demo data
npx prisma db seed

# Start dev server
npm run dev

# (Optional) Start GPS simulator in another terminal
npx tsx src/scripts/tick.ts
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. Neon, local Docker, Supabase) |
| `NEXTAUTH_SECRET` | Auth.js signing key (minimum 32 characters) |
| `NEXTAUTH_URL` | Canonical app URL (`http://localhost:3000` locally, `https://your-domain.vercel.app` in production) |
| `JWT_SECRET` | Secondary signing key for JWT operations (minimum 32 characters) |
| `NODE_ENV` | `development` or `production` |
| `LOG_LEVEL` | `debug`, `info`, `warn`, or `error` |

---

## Deployment Options

### Current Deployment

| Component | Provider | Tier |
|-----------|----------|------|
| Frontend + API | Vercel | Hobby (free) |
| Database | Neon PostgreSQL | Free (0.5 GB) |
| Map Tiles | OpenStreetMap | Free (public CDN) |
| CI/CD | GitHub Actions | Free (public repos) |

### Alternative Deployment Approaches

| Platform | Pros | Cons |
|----------|------|------|
| **Railway** | One-click Postgres + app, simple pricing | Less mature than Vercel for Next.js |
| **Render** | Free PostgreSQL with IPv4, good uptime | Slower cold starts on free tier |
| **Fly.io** | Global edge deployment, PostgreSQL included | Requires Dockerfile tuning for Next.js |
| **VPS + Docker** (DigitalOcean, Hetzner) | Full control, cheapest at scale | Requires ops knowledge (Nginx, SSL, backups) |
| **AWS EC2 + RDS** | Enterprise standard, auto-scaling | Overkill for demo, expensive for small scale |

**Recommended for zero-cost student/demo deployment**: Vercel (frontend) + Neon PostgreSQL (database).

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Login page (unauthenticated)
│   ├── (dashboard)/              # Role-based dashboards
│   │   ├── admin/                # Routes, CMS, notices
│   │   ├── control-room/         # AVLS map, incidents
│   │   ├── depot/                # Roster, fleet tracking
│   │   ├── driver/               # Duty, notices, panic, tracking
│   │   └── executive/            # Analytics charts
│   └── api/v1/                   # Versioned REST API (43 endpoints)
│       ├── auth/                 # Login, logout, session
│       ├── avls/                 # Live tracking, trail, history, stats
│       ├── cms/                  # Notices CRUD, read/acknowledge
│       ├── ims/                  # Incidents, panic, assignments
│       ├── notifications/        # List, mark-read, unread count
│       ├── reporting/            # Daily, incidents, fleet, depot-summary
│       └── scheduling/           # Routes, stops, duties, roster
├── modules/                      # Domain modules (layered architecture)
│   ├── avls/                     # repositories/, services/, hooks/, components/
│   ├── cms/                      # Same pattern
│   ├── ims/                      # Same pattern
│   ├── reporting/                # Same pattern
│   └── scheduling/               # Same pattern
├── components/
│   ├── ui/                       # shadcn/ui primitives (button, card, dialog, etc.)
│   ├── layout/                   # Sidebar, topbar, dashboard shell, mobile nav
│   └── enterprise/               # KPI cards, status badges, filter bars, drawers
├── lib/
│   ├── auth/                     # Auth config, JWT utils, password hashing
│   ├── db/                       # Prisma client singleton
│   ├── permissions/              # RBAC engine + permission map
│   ├── audit/                    # Structured audit event logger
│   ├── logger/                   # Level-aware structured logger
│   └── constants/                # Role labels, route mappings
├── store/                        # Zustand stores (sidebar, theme)
├── providers/                    # React providers (query, theme, auth, toast)
└── scripts/                      # GPS tick simulation (standalone process)

prisma/
├── schema.prisma                 # 27 models, PostGIS, enums, indexes
├── seed.ts                       # Idempotent seed: 80+ users, 50 vehicles, 12 routes, etc.
└── migrations/                   # Prisma migration history
```

---

## API Architecture

All APIs are versioned under `/api/v1/<module>/` and return a consistent response envelope:

```json
// Success
{ "success": true, "data": { ... }, "message": "Human-readable" }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human-readable" } }
```

### Module Endpoints (43 total)

| Module | Count | Key Endpoints |
|--------|-------|---------------|
| **Auth** | 5 | login, logout, me, refresh, [...nextauth] |
| **AVLS** | 5 | live, vehicle/:id, vehicle/:id/trail, history, stats |
| **Scheduling** | 10 | routes CRUD, stops, duties CRUD, duties/publish, duties/today, duties/:id/acknowledge, roster |
| **IMS** | 7 | incidents CRUD, incidents/:id/status, assign, note, panic, stats |
| **CMS** | 9 | notices CRUD, publish, archive, read, acknowledge, read-receipts, my-notices, unread-count |
| **Notifications** | 2 | list + mark-read, unread-count |
| **Reporting** | 4 | daily, incidents, fleet, depot-summary |
| **Health** | 1 | health check |

---

## Security Considerations

| Layer | Implementation |
|-------|---------------|
| **Authentication** | Auth.js v5 Credentials Provider. JWT sessions (24h expiry) with HTTP-only cookies. Database-backed `user_session` table for revocation. |
| **Authorization** | Permission-based RBAC with 6 roles. Admin has wildcard `*`. Depot managers and drivers are scoped to their depot at the repository layer. All API routes check permissions before executing. |
| **Password Storage** | bcryptjs with 12 salt rounds. Passwords are never stored in plaintext. |
| **Middleware** | Auth middleware validates JWT cookies without database calls. Public paths (`/login`, `/api/auth`, static assets) are explicitly excluded. |
| **Input Validation** | All API inputs validated through Zod schemas. No raw user input reaches the database. |
| **SQL Injection** | Prisma parameterized queries for all database operations. No raw SQL. |
| **Secrets** | All secrets via environment variables. `.env` is gitignored. `.env.example` committed with placeholders. |
| **Session Revocation** | Sessions can be individually revoked (`revoked_at` timestamp) or bulk-revoked per user. Logout revokes the current session. |

---

## Demo Flow for Reviewers

Follow these steps to evaluate the full system:

### Phase 1: Admin Setup
1. Login as `admin` / `password123`
2. Navigate to **Route Management** (`/admin/routes`)
3. Click **Create Route** — build a route with ordered stops
4. Navigate to **Notice Management** (`/admin/cms`)
5. Create and publish a notice targeting all drivers

### Phase 2: Depot Operations
6. Login as `dm.noida` / `password123`
7. Open **Weekly Roster** (`/depot/roster`)
8. Click a cell to assign a driver, vehicle, route, and time
9. Click **Publish All** to publish draft duties

### Phase 3: Driver Experience
10. Login as `driver.raj.01` / `password123`
11. View **Today's Duty** (`/driver/duty`) — tap **Acknowledge**
12. Open **Notices** (`/driver/notices`) — read the notice you published
13. Navigate to **Panic** (`/driver/panic`) — hold the red button for 2.5 seconds

### Phase 4: Control Room Response
14. Login as `control.operator1` / `password123`
15. Open **Live Fleet Map** (`/control-room/avls`) — observe moving buses
16. Click a vehicle marker — view detail drawer + trail polyline
17. Open **Incident Command Center** (`/control-room/incidents`)
18. Find the P1 panic incident — assign it — update status — resolve

### Phase 5: Executive Oversight
19. Login as `executive1` / `password123`
20. View fleet utilization charts, incident breakdowns, depot performance

### Phase 6: AVLS History
21. Login as `control.operator1`
22. Open **GPS History** (`/control-room/avls/history`)
23. Select a vehicle and date — view the full-day path

---

## Future Improvements

| Priority | Feature | Effort |
|----------|---------|--------|
| **High** | Real GPS device integration via MQTT ingest pipeline | Medium |
| **High** | WebSocket-based real-time AVLS updates | Medium |
| **Medium** | Multi-tenancy activation (multiple organizations) | Low |
| **Medium** | SMS/email notification channels for P1 panic alerts | Medium |
| **Medium** | PDF report generation and export | Low |
| **Medium** | OAuth provider support (Google, Microsoft) as secondary auth | Low |
| **Low** | Drag-and-drop stop ordering in route builder | Low |
| **Low** | Interactive replay slider for GPS history | Medium |
| **Future** | React Native mobile app with offline support | High |
| **Future** | ML-based route optimization and predictive maintenance | High |
| **Future** | Microservice extraction for AVLS and IMS if scale demands it | High |

---

## Known Limitations

| Limitation | Reason | Production Fix |
|------------|--------|----------------|
| GPS is simulated | No hardware available for development | Replace tick script with MQTT ingest pipeline |
| Polling-based live updates | Simpler than WebSockets, sufficient for 50 vehicles | Add WebSocket/SSE layer without changing data model |
| No email/push notifications | Cost and complexity constraint for demo | Add notification channels (SendGrid, Firebase) |
| Local file uploads (`/public/uploads`) | Avoids cloud storage dependency | Migrate to S3/Cloudflare R2 with storage abstraction |
| Auth.js v5 is in beta | Latest available during development | Update to stable release when available |
| Credentials-only (no OAuth) | Appropriate for operational staff without corporate SSO | Add OAuth as secondary provider |
| Command palette is static navigation | Full search would require indexing across entities | Add Fuse.js or similar client-side search |
| No drag-and-drop stop ordering | Uses up/down buttons for reordering | Implement with `@dnd-kit` or similar |

---

## Author

Built as a full-stack capstone engineering project demonstrating production SaaS architecture, enterprise UI design, and modular monolith patterns for transportation operations software.
