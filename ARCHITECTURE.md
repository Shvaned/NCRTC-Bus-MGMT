# NCRTC BMS — Architecture Document

## System Overview

The NCRTC Bus Management System is a **modular monolith** built on Next.js 16 with the App Router. It serves the National Capital Region Transport Corporation's bus fleet operations including live vehicle tracking, scheduling, incident management, and fleet communications.

### Architecture Style

**Production SaaS Modular Monolith** — a single deployable application with strict domain module boundaries. Each module is self-contained and could be extracted into a separate service in the future without architectural change.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router                 │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  AVLS    │  │Scheduling│  │   IMS    │  │   CMS   │ │
│  │ Module   │  │ Module   │  │  Module  │  │ Module  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │              │              │              │     │
│  ┌────┴──────────────┴──────────────┴──────────────┴──┐ │
│  │                  Shared Lib Layer                   │ │
│  │  Auth │ Permissions │ Audit │ Logger │ Validators  │ │
│  └─────────────────────┬───────────────────────────────┘ │
│                        │                                  │
│                   ┌────┴─────┐                            │
│                   │  Prisma  │                            │
│                   │  (ORM)   │                            │
│                   └────┬─────┘                            │
└────────────────────────┼──────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │   PostgreSQL 16     │
              │   + PostGIS 3.4     │
              └─────────────────────┘

┌────────────────────────────────────┐
│         GPS Tick Simulator         │
│  (Standalone Node.js process)      │
│  Runs every 5 seconds              │
│  Writes gps_ping + live_state      │
└────────────────────────────────────┘
```

---

## Module Boundaries

Each module follows the same layered architecture:

```
src/modules/<name>/
├── api/session.ts         # Auth helper for API routes
├── types/index.ts         # Domain types
├── constants/index.ts     # Labels, status maps, colors
├── validators/index.ts    # Zod schemas
├── permissions/index.ts   # Module-specific permission checks
├── repositories/          # Data access layer (Prisma queries)
├── services/              # Business logic layer
├── hooks/                 # TanStack Query hooks (client)
└── components/            # Module-specific UI components
```

### Data Flow

```
HTTP Request → API Route (controller)
  → Service (business logic, validation, audit, notifications)
    → Repository (Prisma queries)
      → Database

Query Response ← API Route
  ← Service (enrichment, transformation)
    ← Repository (raw data)
      ← Database
```

---

## Authentication & Authorization

### Auth Flow

1. User submits credentials via login form
2. Auth.js v5 Credentials Provider validates against bcrypt-hashed passwords in DB
3. On success, JWT is created (24h expiry) with user ID, role, depotId, organizationId
4. JWT stored in HTTP-only cookie, session record created in `user_session` table
5. Subsequent requests validate JWT cookie, decode role/permissions from token

### RBAC Model

Six fixed roles with a permission map:

```
Role              → Permissions
admin             → * (wildcard — all permissions)
control_operator  → avls.view, avls.history, incident.*, notice.*, duty.read, duty.assign, gps.read
depot_manager     → route.*, duty.* (scoped), incident.* (scoped), avls.view (scoped), stop.*
driver            → duty.read, duty.acknowledge, incident.read, incident.write, incident.panic, notice.read, notice.acknowledge
conductor         → duty.read, incident.read, incident.write, notice.read, notice.acknowledge
executive         → READ-ONLY analytics + reporting access
```

Permission checks use `hasPermission(role, permission)` which supports wildcards.

### Depot Scoping

- **Depot-scoped roles**: depot_manager, driver, conductor — can only access their depot's data
- **Full-access roles**: admin, control_operator, executive — can access all depots
- Scoping enforced at the repository/service layer, not middleware

---

## Database Design

### Schema: 27 Models, 6 Domains

```
Core SaaS:
  organization, user, role, permission, role_permission,
  user_session, audit_log, file_upload, notification

Fleet:
  depot, vehicle, vehicle_live_state, stop, route, route_stop

Scheduling:
  duty (DRAFT→PUBLISHED→ACKNOWLEDGED→COMPLETED→MISSED), leave_request

AVLS:
  gps_ping, trip_gps_session, geofence_event

IMS:
  incident (OPEN→ACKNOWLEDGED→IN_PROGRESS→RESOLVED→CLOSED),
  incident_event, incident_attachment, incident_assignment_history

CMS:
  notice (DRAFT→PUBLISHED→ARCHIVED), notice_read
```

### Key Design Decisions

- **UUID primary keys** — distributed-safe, no sequential ID leakage
- **Soft deletes** — `deleted_at` on all major entities
- **organization_id** — multi-tenancy ready (currently single org: NCRTC)
- **PostGIS** — `geometry(Point, 4326)` on stops and GPS pings for spatial queries
- **Enum usage** — all status fields use Prisma enums, no raw strings
- **Indexes on hot paths** — `gps_ping(vehicle_id, ts DESC)`, `duty(date, depot_id)`, `incident(status, depot_id)`

---

## AVLS Simulation Strategy

The GPS simulator is a standalone Node.js process (`src/scripts/tick.ts`) that:

1. **Every 5 seconds**, queries for vehicles with active PUBLISHED/ACKNOWLEDGED duties today
2. **For each active vehicle**, simulates movement along the route's stop sequence:
   - Uses `Date.now() % cycleMs` for time-based position (30-min cycle per route)
   - Interpolates latitude/longitude between consecutive stops
   - Applies speed variation: slows near stops, random 25-55 km/h
   - Adds GPS jitter (±0.0003°)
3. **Writes** `gps_ping` record and updates `vehicle_live_state`

### Why vehicle_live_state vs computing from gps_ping?

`vehicle_live_state` is an optimized table containing only the latest state per vehicle. Querying this table for 50 vehicles is a single indexed query. Computing from raw `gps_ping` would require aggregation over millions of rows.

### Production GPS Evolution

The simulation engine is swap-safe:
1. Replace `runSimulationTick()` with an MQTT/HTTP ingest handler
2. GPS devices publish to an endpoint or queue
3. Handler writes `gps_ping` + updates `vehicle_live_state`
4. Same tables, same API, same frontend — just a different data source

---

## API Design

### REST, Versioned

All APIs under `/api/v1/<module>/` with standard response envelope:

```json
// Success
{ "success": true, "data": {}, "message": "" }

// Error
{ "success": false, "error": { "code": "CODE", "message": "Human message" } }
```

### Endpoints by Module (51 total)

| Module | Endpoints | Count |
|--------|-----------|-------|
| Auth | login, logout, me, refresh, [...nextauth] | 5 |
| AVLS | live, vehicle/:id, vehicle/:id/trail, history, stats | 5 |
| Scheduling | routes, routes/:id/archive, stops, duties, duties/publish, duties/today, duties/:id/acknowledge, roster | 10 |
| IMS | incidents, incidents/:id, incidents/:id/status, incidents/:id/assign, incidents/:id/note, panic, stats | 7 |
| CMS | notices, notices/:id, notices/:id/publish, notices/:id/archive, notices/:id/read, notices/:id/acknowledge, notices/:id/read-receipts, my-notices, unread-count | 9 |
| Notifications | notifications (GET/PATCH), unread-count | 2 |
| Reporting | daily, incidents, fleet, depot-summary | 4 |
| Health | health | 1 |
| **Total** | | **43 dynamic** |

---

## UI Architecture

### Component Hierarchy

```
RootLayout (providers: Theme, Auth, Query, App)
├── LoginPage
└── DashboardLayout
    ├── Sidebar (collapsible, role-aware)
    ├── Topbar (notification bell, theme toggle, CMD+K, user menu)
    ├── OfflineBanner
    ├── Main Content (role-based pages)
    ├── DriverBottomNav (driver routes only, mobile only)
    └── PWAInstallPrompt
```

### Enterprise Components

Reusable across all modules:
- `KPICard` — Metric display with icon, trend
- `StatusBadge` — Color-coded status indicator
- `PageHeader` — Title + description + action buttons
- `FilterBar` — Search + filter controls
- `TableSkeleton` — Loading placeholders for tables
- `EmptyState` — Professional empty views
- `ErrorState` — Error views with retry
- `SlidingDrawer` — Right-side detail panel

### State Management

- **TanStack Query** — Server state caching, polling, mutations
- **Zustand** — UI-only state (sidebar collapse, mobile menu, theme)

---

## Deployment Strategy

### Current: Docker Compose

Single `docker compose up` starts:
- PostgreSQL 16 + PostGIS 3.4
- Prisma migrations + seed
- Next.js production server
- GPS tick simulator

### Target: Vercel + Supabase

- **Frontend**: Vercel Hobby (free) for the Next.js app
- **Database**: Supabase PostgreSQL (free tier, 500MB)
- **GPS Simulator**: GitHub Actions scheduled workflow or small VPS cron
- **File Uploads**: Supabase Storage or Cloudflare R2

---

## Future Evolution Path

### Phase 8: Production Deployment
- Vercel deployment, Supabase PostgreSQL
- SSL, custom domain, uptime monitoring
- CDN for static assets

### Phase 9: Real GPS Integration
- MQTT broker for device communication
- GPS ingest API endpoint
- Device provisioning and management

### Phase 10: Real-Time
- Server-Sent Events for AVLS live updates
- Push notifications via web push API
- Replace polling with event-driven architecture

### Phase 11: Mobile App
- React Native driver app
- Offline-first with local SQLite
- Camera integration for incident photos

### Phase 12: Scale
- Extract modules into microservices if needed
- Message queue (Redis/RabbitMQ) for inter-service communication
- Read replicas for reporting queries
- CDN-cached tile server for maps

### Microservice Extraction (if needed)

If the system needs to scale beyond the monolith:

```
Gateway (NGINX/Traefik)
├── Auth Service       (extracted from lib/auth)
├── AVLS Service       (extracted from modules/avls)
├── Scheduling Service (extracted from modules/scheduling)
├── IMS Service        (extracted from modules/ims)
├── CMS Service        (extracted from modules/cms)
├── Reporting Service  (extracted from modules/reporting)
└── Message Queue       (Redis/Kafka for events)

Each service maintains its own Prisma schema subset
or shares the database with schema-level isolation.
```

---

## Security Considerations

- **Password hashing**: bcrypt with 12 salt rounds
- **Session management**: JWT + database-backed sessions with revocation
- **RBAC**: All API routes check permissions; depot-scoped roles filtered at query level
- **Input validation**: Zod schemas on all API inputs
- **No secrets in code**: All secrets via environment variables, `.env` gitignored
- **No raw SQL**: Prisma parameterized queries prevent injection
- **HTTP-only cookies**: JWT sessions not accessible from JavaScript

---

## Performance Characteristics

- **AVLS map**: ~50 markers with 5s polling — < 2KB per response
- **Live queries**: `vehicle_live_state` indexed by status, single table scan
- **Trail queries**: `gps_ping` indexed by `(vehicle_id, ts DESC)`, limited to 300 rows
- **History**: Full-day scan with date range, < 500 pings per vehicle per day
- **Roster**: Pre-computed from duties with driver/route join — < 100 rows per depot
- **Memory**: ~200MB Node.js heap (Next.js default)
- **Database**: < 50MB for seed data, grows ~1MB/day with GPS pings
