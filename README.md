# NCRTC Bus Management System (BMS)

Enterprise-grade bus fleet management system for the **National Capital Region Transport Corporation (NCRTC)**. A production SaaS-style modular monolith built with Next.js 16, TypeScript, PostgreSQL/PostGIS, and Docker.

---

## Features

### Core Infrastructure
- **Authentication & RBAC** — 6 roles (admin, control_operator, depot_manager, driver, conductor, executive), permission-based access control, JWT + database-backed sessions
- **Dashboard Shell** — Enterprise sidebar, role-based layouts, dark theme default, responsive design
- **Multi-tenancy** — organization-scoped data, depot-level access control
- **Audit Logging** — Every major action tracked with structured audit events

### AVLS — Live Vehicle Tracking
- Real-time fleet map with Leaflet + OpenStreetMap
- GPS simulation engine (server-side tick, 5-second interval)
- Vehicle trail (last 30 minutes), speed/direction, status badges
- Depot filtering, vehicle search, live polling via TanStack Query
- Full-day GPS history with trip session summaries
- Command center layout (70% map / 30% operations panel)

### Scheduling — Routes, Duties & Rosters
- Route management with ordered stop builder (move up/down)
- Weekly roster grid (drivers × days) with click-to-assign
- Driver/vehicle/conductor conflict prevention
- Publish workflow: DRAFT → PUBLISHED → ACKNOWLEDGED → COMPLETED
- Driver duty view with acknowledge button
- Notification on duty publish

### IMS — Incident Management System
- Full incident lifecycle: OPEN → ACKNOWLEDGED → IN_PROGRESS → RESOLVED → CLOSED
- Panic button with hold-to-confirm (2.5s hold required)
- Auto-creates P1 incident with vehicle, depot, GPS location
- Timeline visualization, assignment workflow, status transitions with mandatory notes
- Incident command center with priority P1-first ordering
- AVLS integration — jump to vehicle history from incident

### CMS — Notices & Communications
- Rich notice creation with audience targeting (ALL_DRIVERS / DEPOT / ROLE)
- Publish workflow with read receipts and acknowledgements
- Driver mobile-first notice list with unread priority
- Read progress bars, acknowledgement tracking

### Driver PWA
- Mobile-first experience (320px responsive)
- Bottom navigation bar (Home, Duty, Notices, Incidents, Panic)
- Touch-friendly large targets, offline banner
- Install prompt for PWA support

### Executive Dashboard
- Fleet utilization trends (Recharts)
- Incident breakdown by severity and type
- Depot performance comparison
- Duty completion rates

### Reporting
- Daily reports (fleet, duties, incidents)
- Incident aggregation by severity/type
- Fleet utilization metrics
- Depot performance summaries

### Notification Center
- Unified notifications across all modules
- Bell icon with unread count in header
- Mark all read, per-notification action links

### Enterprise UX
- CMD+K command palette for global navigation
- Professional error boundaries, loading skeletons, empty states
- Dark theme optimized, responsive sidebar
- shadcn/ui component library

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + PostGIS |
| ORM | Prisma 7 |
| Auth | Auth.js v5 (Credentials) |
| Styling | TailwindCSS 4 + shadcn/ui |
| State | TanStack Query + Zustand |
| Forms | React Hook Form + Zod |
| Maps | Leaflet + react-leaflet |
| Charts | Recharts |
| Testing | Vitest + Testing Library |
| DevOps | Docker + GitHub Actions |

---

## Architecture

**Modular monolith** — single Next.js application organized into domain modules. Each module follows: Controller (API Route) → Service (Business Logic) → Repository (Data Access).

### Folder Structure

```
src/
├── app/                      # Next.js App Router pages & API routes
│   ├── (auth)/               # Login
│   ├── (dashboard)/          # Role-based dashboards
│   └── api/v1/               # Versioned REST API
├── modules/                  # Domain modules
│   ├── avls/                 # GPS tracking, simulation
│   ├── cms/                  # Notice management
│   ├── ims/                  # Incident management
│   ├── reporting/            # Analytics & reports
│   └── scheduling/           # Fleet scheduling
├── components/               # Shared UI components
│   ├── ui/                   # shadcn/ui primitives
│   ├── layout/               # Shell, sidebar, topbar, nav
│   └── enterprise/           # KPI cards, status badges
├── lib/                      # Shared infrastructure
│   ├── auth/                 # JWT, password hashing
│   ├── permissions/          # RBAC engine
│   └── audit/                # Audit logging
└── scripts/                  # GPS tick simulation
```

### Database (27 Models)

- **Core SaaS**: Organization, User, Role, Permission, Session, AuditLog, FileUpload, Notification
- **Fleet**: Depot, Vehicle, VehicleLiveState, Stop, Route, RouteStop
- **Scheduling**: Duty, LeaveRequest
- **AVLS**: GpsPing, TripGpsSession, GeofenceEvent
- **IMS**: Incident, IncidentEvent, IncidentAttachment, IncidentAssignmentHistory
- **CMS**: Notice, NoticeRead

### Why Modular Monolith?

Single deployment, zero network overhead, clear module boundaries for future extraction. Runs on Vercel Hobby + Supabase free tier.

### Why Polling Instead of WebSockets?

5-second polling via TanStack Query is simpler, more reliable, and sufficient for 50 vehicles. WebSockets can be added later.

---

## Setup Guide

### Quick Start (Docker)

```bash
git clone <repo-url> && cd qtloads
docker compose up --build
```

Opens http://localhost:3000 with PostgreSQL, migrations, seed data, and app all running.

### Local Development

```bash
npm install
cp .env.example .env
docker compose up postgres -d
npx prisma migrate dev --name init
npx prisma db seed
npm run dev

# Optional: Start GPS simulator
npx tsx src/scripts/tick.ts
```

---

## Demo Credentials

All passwords: `password123`

| Username | Role | Key Access |
|----------|------|------------|
| `admin` | Administrator | Everything |
| `control.operator1` | Control Operator | AVLS, IMS, CMS |
| `dm.noida` | Depot Manager | Routes, roster, depot fleet |
| `driver.raj.01` | Driver | Duty, notices, panic |
| `conductor.01` | Conductor | Duty view, incident report |
| `executive1` | Executive | Analytics dashboard |

---

## Demo Flow

1. **Login as admin** → create route at `/admin/routes/create`
2. **Login as depot manager** (`dm.noida`) → assign & publish duty at `/depot/roster`
3. **Login as driver** (`driver.raj.01`) → view duty at `/driver/duty` → acknowledge
4. **Read notices** at `/driver/notices` → tap to read
5. **Trigger panic** at `/driver/panic` → hold 2.5s → P1 incident created
6. **Login as control operator** (`control.operator1`) → live map at `/control-room/avls`
7. **View P1 incident** at `/control-room/incidents` → assign → resolve
8. **Login as executive** (`executive1`) → analytics at `/executive`

---

## Known Limitations

- GPS simulation only (no real device integration)
- Polling-based updates (5s AVLS, 30s other)
- No WebSocket support
- Local file uploads (not cloud-scalable)
- Auth.js v5 beta
- No email/push notifications (in-app only)
- No PDF export
- No OAuth providers

---

## Future Roadmap

| Phase | Features |
|-------|----------|
| Production Deploy | Vercel, Supabase, SSL, monitoring |
| Real GPS | Device integration, MQTT ingest |
| WebSockets | Real-time AVLS, push notifications |
| Mobile App | React Native driver app |
| Advanced Analytics | ML route optimization, predictive maintenance |
