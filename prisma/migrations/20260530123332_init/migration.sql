-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'control_operator', 'depot_manager', 'driver', 'conductor', 'executive');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('P1', 'P2', 'P3');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('BREAKDOWN', 'ACCIDENT', 'COMPLAINT', 'PANIC', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('active', 'inactive', 'maintenance', 'decommissioned');

-- CreateEnum
CREATE TYPE "DutyStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ACKNOWLEDGED', 'COMPLETED', 'MISSED');

-- CreateEnum
CREATE TYPE "RouteStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('info', 'warning', 'alert', 'success');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'view', 'export');

-- CreateEnum
CREATE TYPE "VehicleLiveStatus" AS ENUM ('ACTIVE', 'IDLE', 'OFFLINE', 'MAINTENANCE', 'OFF_ROUTE');

-- CreateEnum
CREATE TYPE "NoticeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "organization" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "logoUrl" VARCHAR(500),
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'driver',
    "username" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "employee_id" VARCHAR(50),
    "depot_id" UUID,
    "avatar_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "group" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_session" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "device_info" VARCHAR(500),
    "ip_address" VARCHAR(45),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" "AuditAction" NOT NULL,
    "entity" VARCHAR(100) NOT NULL,
    "entity_id" VARCHAR(100),
    "details" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_upload" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "file_name" VARCHAR(500) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "url" VARCHAR(1000) NOT NULL,
    "entity_type" VARCHAR(100),
    "entity_id" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'info',
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "action_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "depot" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "address" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "location" geometry(Point, 4326),
    "contact_phone" VARCHAR(20),
    "capacity" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "depot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "depot_id" UUID NOT NULL,
    "registration_number" VARCHAR(50) NOT NULL,
    "vehicle_type" VARCHAR(50) NOT NULL,
    "make" VARCHAR(100),
    "model" VARCHAR(100),
    "year" INTEGER,
    "capacity" INTEGER,
    "status" "VehicleStatus" NOT NULL DEFAULT 'active',
    "device_id" VARCHAR(100),
    "current_latitude" DECIMAL(10,7),
    "current_longitude" DECIMAL(10,7),
    "last_ping_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_live_state" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "driver_id" UUID,
    "route_id" UUID,
    "status" "VehicleLiveStatus" NOT NULL DEFAULT 'OFFLINE',
    "speed" DECIMAL(8,2),
    "heading" DECIMAL(6,2),
    "ignition" BOOLEAN,
    "odometer" INTEGER,
    "fuel_level" DECIMAL(5,2),
    "temperature" DECIMAL(5,2),
    "trip_status" VARCHAR(50),
    "last_ping_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_live_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stop" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50),
    "address" TEXT,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "location" geometry(Point, 4326),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "depot_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "origin" VARCHAR(255),
    "destination" VARCHAR(255),
    "distance_km" DECIMAL(8,2),
    "estimated_time_min" INTEGER,
    "status" "RouteStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_stop" (
    "id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "stop_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "arrival_min" INTEGER,

    CONSTRAINT "route_stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duty" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "depot_id" UUID NOT NULL,
    "driver_id" UUID,
    "conductor_id" UUID,
    "vehicle_id" UUID,
    "route_id" UUID,
    "date" DATE NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" "DutyStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "ack_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "duty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_request" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'pending',
    "reviewed_by" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gps_ping" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "location" geometry(Point, 4326),
    "speed" DECIMAL(8,2),
    "heading" DECIMAL(6,2),
    "accuracy" DECIMAL(8,2),
    "ignition" BOOLEAN,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gps_ping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_gps_session" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "route_id" UUID,
    "duty_id" UUID,
    "session_status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "distance_km" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_gps_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geofence_event" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "geofence_id" VARCHAR(100) NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geofence_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "depot_id" UUID,
    "vehicle_id" UUID,
    "reported_by_id" UUID NOT NULL,
    "assigned_to_id" UUID,
    "type" "IncidentType" NOT NULL DEFAULT 'OTHER',
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'P2',
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_event" (
    "id" UUID NOT NULL,
    "incident_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "from_status" VARCHAR(50),
    "to_status" VARCHAR(50),
    "note" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_attachment" (
    "id" UUID NOT NULL,
    "incident_id" UUID NOT NULL,
    "file_name" VARCHAR(500) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "url" VARCHAR(1000) NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_assignment_history" (
    "id" UUID NOT NULL,
    "incident_id" UUID NOT NULL,
    "assigned_to" UUID NOT NULL,
    "assigned_by" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassigned_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "incident_assignment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notice" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "content" TEXT NOT NULL,
    "status" "NoticeStatus" NOT NULL DEFAULT 'DRAFT',
    "audience_json" JSONB,
    "requires_ack" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notice_read" (
    "id" UUID NOT NULL,
    "notice_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "read_at" TIMESTAMP(3),
    "acknowledged_at" TIMESTAMP(3),

    CONSTRAINT "notice_read_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_employee_id_key" ON "user"("employee_id");

-- CreateIndex
CREATE INDEX "user_organization_id_idx" ON "user"("organization_id");

-- CreateIndex
CREATE INDEX "user_depot_id_idx" ON "user"("depot_id");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permission_code_key" ON "permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_session_token_hash_key" ON "user_session"("token_hash");

-- CreateIndex
CREATE INDEX "user_session_user_id_idx" ON "user_session"("user_id");

-- CreateIndex
CREATE INDEX "user_session_token_hash_idx" ON "user_session"("token_hash");

-- CreateIndex
CREATE INDEX "user_session_expires_at_idx" ON "user_session"("expires_at");

-- CreateIndex
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");

-- CreateIndex
CREATE INDEX "audit_log_entity_entity_id_idx" ON "audit_log"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- CreateIndex
CREATE INDEX "file_upload_user_id_idx" ON "file_upload"("user_id");

-- CreateIndex
CREATE INDEX "file_upload_entity_type_entity_id_idx" ON "file_upload"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "notification_user_id_is_read_idx" ON "notification"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notification_user_id_created_at_idx" ON "notification"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "depot_code_key" ON "depot"("code");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_registration_number_key" ON "vehicle"("registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_device_id_key" ON "vehicle"("device_id");

-- CreateIndex
CREATE INDEX "vehicle_organization_id_idx" ON "vehicle"("organization_id");

-- CreateIndex
CREATE INDEX "vehicle_depot_id_idx" ON "vehicle"("depot_id");

-- CreateIndex
CREATE INDEX "vehicle_status_idx" ON "vehicle"("status");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_live_state_vehicle_id_key" ON "vehicle_live_state"("vehicle_id");

-- CreateIndex
CREATE INDEX "vehicle_live_state_status_idx" ON "vehicle_live_state"("status");

-- CreateIndex
CREATE INDEX "vehicle_live_state_driver_id_idx" ON "vehicle_live_state"("driver_id");

-- CreateIndex
CREATE UNIQUE INDEX "stop_code_key" ON "stop"("code");

-- CreateIndex
CREATE INDEX "stop_organization_id_idx" ON "stop"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "route_code_key" ON "route"("code");

-- CreateIndex
CREATE INDEX "route_organization_id_idx" ON "route"("organization_id");

-- CreateIndex
CREATE INDEX "route_depot_id_idx" ON "route"("depot_id");

-- CreateIndex
CREATE INDEX "route_status_idx" ON "route"("status");

-- CreateIndex
CREATE UNIQUE INDEX "route_stop_route_id_sequence_key" ON "route_stop"("route_id", "sequence");

-- CreateIndex
CREATE INDEX "duty_date_depot_id_idx" ON "duty"("date", "depot_id");

-- CreateIndex
CREATE INDEX "duty_driver_id_idx" ON "duty"("driver_id");

-- CreateIndex
CREATE INDEX "duty_conductor_id_idx" ON "duty"("conductor_id");

-- CreateIndex
CREATE INDEX "duty_vehicle_id_idx" ON "duty"("vehicle_id");

-- CreateIndex
CREATE INDEX "duty_status_depot_id_idx" ON "duty"("status", "depot_id");

-- CreateIndex
CREATE INDEX "leave_request_user_id_idx" ON "leave_request"("user_id");

-- CreateIndex
CREATE INDEX "leave_request_status_idx" ON "leave_request"("status");

-- CreateIndex
CREATE INDEX "gps_ping_vehicle_id_ts_idx" ON "gps_ping"("vehicle_id", "ts" DESC);

-- CreateIndex
CREATE INDEX "gps_ping_ts_idx" ON "gps_ping"("ts");

-- CreateIndex
CREATE INDEX "trip_gps_session_vehicle_id_idx" ON "trip_gps_session"("vehicle_id");

-- CreateIndex
CREATE INDEX "trip_gps_session_duty_id_idx" ON "trip_gps_session"("duty_id");

-- CreateIndex
CREATE INDEX "trip_gps_session_session_status_idx" ON "trip_gps_session"("session_status");

-- CreateIndex
CREATE INDEX "geofence_event_vehicle_id_ts_idx" ON "geofence_event"("vehicle_id", "ts");

-- CreateIndex
CREATE INDEX "incident_status_depot_id_idx" ON "incident"("status", "depot_id");

-- CreateIndex
CREATE INDEX "incident_vehicle_id_idx" ON "incident"("vehicle_id");

-- CreateIndex
CREATE INDEX "incident_reported_by_id_idx" ON "incident"("reported_by_id");

-- CreateIndex
CREATE INDEX "incident_assigned_to_id_idx" ON "incident"("assigned_to_id");

-- CreateIndex
CREATE INDEX "incident_organization_id_idx" ON "incident"("organization_id");

-- CreateIndex
CREATE INDEX "incident_severity_idx" ON "incident"("severity");

-- CreateIndex
CREATE INDEX "incident_type_idx" ON "incident"("type");

-- CreateIndex
CREATE INDEX "incident_event_incident_id_idx" ON "incident_event"("incident_id");

-- CreateIndex
CREATE INDEX "incident_attachment_incident_id_idx" ON "incident_attachment"("incident_id");

-- CreateIndex
CREATE INDEX "incident_assignment_history_incident_id_idx" ON "incident_assignment_history"("incident_id");

-- CreateIndex
CREATE INDEX "notice_organization_id_idx" ON "notice"("organization_id");

-- CreateIndex
CREATE INDEX "notice_status_idx" ON "notice"("status");

-- CreateIndex
CREATE INDEX "notice_published_at_idx" ON "notice"("published_at");

-- CreateIndex
CREATE INDEX "notice_author_id_idx" ON "notice"("author_id");

-- CreateIndex
CREATE INDEX "notice_read_user_id_idx" ON "notice_read"("user_id");

-- CreateIndex
CREATE INDEX "notice_read_notice_id_read_at_idx" ON "notice_read"("notice_id", "read_at");

-- CreateIndex
CREATE UNIQUE INDEX "notice_read_notice_id_user_id_key" ON "notice_read"("notice_id", "user_id");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_depot_id_fkey" FOREIGN KEY ("depot_id") REFERENCES "depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depot" ADD CONSTRAINT "depot_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_depot_id_fkey" FOREIGN KEY ("depot_id") REFERENCES "depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_live_state" ADD CONSTRAINT "vehicle_live_state_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route" ADD CONSTRAINT "route_depot_id_fkey" FOREIGN KEY ("depot_id") REFERENCES "depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stop" ADD CONSTRAINT "route_stop_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stop" ADD CONSTRAINT "route_stop_stop_id_fkey" FOREIGN KEY ("stop_id") REFERENCES "stop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duty" ADD CONSTRAINT "duty_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duty" ADD CONSTRAINT "duty_depot_id_fkey" FOREIGN KEY ("depot_id") REFERENCES "depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duty" ADD CONSTRAINT "duty_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gps_ping" ADD CONSTRAINT "gps_ping_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_gps_session" ADD CONSTRAINT "trip_gps_session_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geofence_event" ADD CONSTRAINT "geofence_event_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident" ADD CONSTRAINT "incident_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident" ADD CONSTRAINT "incident_depot_id_fkey" FOREIGN KEY ("depot_id") REFERENCES "depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_event" ADD CONSTRAINT "incident_event_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_attachment" ADD CONSTRAINT "incident_attachment_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_assignment_history" ADD CONSTRAINT "incident_assignment_history_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice" ADD CONSTRAINT "notice_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice_read" ADD CONSTRAINT "notice_read_notice_id_fkey" FOREIGN KEY ("notice_id") REFERENCES "notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
