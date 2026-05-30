export type IncidentTypeEnum = "BREAKDOWN" | "ACCIDENT" | "COMPLAINT" | "PANIC" | "OTHER"
export type IncidentSeverityEnum = "P1" | "P2" | "P3"
export type IncidentStatusEnum = "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"

export interface IncidentListItem {
  id: string
  type: IncidentTypeEnum
  severity: IncidentSeverityEnum
  status: IncidentStatusEnum
  title: string
  vehicleReg: string | null
  depotName: string | null
  reportedByName: string | null
  assignedToName: string | null
  createdAt: string
}

export interface IncidentTimelineEvent {
  id: string
  userId: string
  userName: string
  eventType: string
  fromStatus: string | null
  toStatus: string | null
  note: string | null
  createdAt: string
}

export interface AssignmentHistoryItem {
  id: string
  assignedTo: string
  assignedToName: string
  assignedBy: string
  assignedByName: string
  assignedAt: string
  unassignedAt: string | null
  notes: string | null
}

export interface IncidentAttachment {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
  uploadedBy: string
  createdAt: string
}

export interface IncidentDetail extends IncidentListItem {
  description: string | null
  vehicleId: string | null
  depotId: string | null
  reportedById: string
  assignedToId: string | null
  latitude: number | null
  longitude: number | null
  resolvedAt: string | null
  updatedAt: string
  timeline: IncidentTimelineEvent[]
  attachments: IncidentAttachment[]
  assignmentHistory: AssignmentHistoryItem[]
}

export interface IncidentStats {
  total: number
  open: number
  critical: number
  resolvedToday: number
  avgResolutionHours: number | null
}
