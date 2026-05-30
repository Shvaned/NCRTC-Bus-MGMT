import type { IncidentTypeEnum, IncidentSeverityEnum, IncidentStatusEnum } from "../types"

export const INCIDENT_TYPE_LABELS: Record<IncidentTypeEnum, string> = {
  BREAKDOWN: "Breakdown",
  ACCIDENT: "Accident",
  COMPLAINT: "Complaint",
  PANIC: "Panic",
  OTHER: "Other",
}

export const SEVERITY_LABELS: Record<IncidentSeverityEnum, string> = {
  P1: "P1 - Critical",
  P2: "P2 - Major",
  P3: "P3 - Minor",
}

export const SEVERITY_COLORS: Record<IncidentSeverityEnum, string> = {
  P1: "bg-red-500/15 text-red-400 border-red-500/30",
  P2: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  P3: "bg-blue-500/15 text-blue-400 border-blue-500/30",
}

export const STATUS_LABELS: Record<IncidentStatusEnum, string> = {
  OPEN: "Open",
  ACKNOWLEDGED: "Acknowledged",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
}

export const STATUS_COLORS: Record<IncidentStatusEnum, string> = {
  OPEN: "bg-red-500/15 text-red-400 border-red-500/30",
  ACKNOWLEDGED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  IN_PROGRESS: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  RESOLVED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  CLOSED: "bg-muted text-muted-foreground border-muted",
}

export const VALID_TRANSITIONS: Record<IncidentStatusEnum, IncidentStatusEnum[]> = {
  OPEN: ["ACKNOWLEDGED", "CLOSED"],
  ACKNOWLEDGED: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: [],
}

export const UPLOAD_MAX_SIZE = 5 * 1024 * 1024 // 5MB
export const UPLOAD_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"]
