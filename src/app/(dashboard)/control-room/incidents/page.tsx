"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { useIncidents, useIncidentDetail, useAssignIncident, useTransitionStatus, useAddNote, useIncidentStats } from "@/modules/ims/hooks/use-incidents"
import { SEVERITY_LABELS, SEVERITY_COLORS, STATUS_LABELS, STATUS_COLORS, INCIDENT_TYPE_LABELS, VALID_TRANSITIONS } from "@/modules/ims/constants"
import type { IncidentDetail, IncidentStatusEnum } from "@/modules/ims/types"
import { PageHeader } from "@/components/enterprise/page-header"
import { FilterBar } from "@/components/enterprise/filter-bar"
import { EmptyState } from "@/components/enterprise/empty-state"
import { ErrorState } from "@/components/enterprise/error-state"
import { TableSkeleton } from "@/components/enterprise/loading-skeletons"
import { SlidingDrawer } from "@/components/enterprise/sliding-drawer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, AlertTriangle, Eye, UserPlus, ArrowRight, MessageSquare, Shield, Clock, CheckCircle, Loader2 } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function ControlRoomIncidentsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [severityFilter, setSeverityFilter] = useState("")
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data, isLoading, isError, refetch } = useIncidents({
    search, status: statusFilter, severity: severityFilter, page, limit: 15,
  })

  const { data: statsData } = useIncidentStats()

  return (
    <div className="space-y-4">
      <PageHeader title="Incident Command Center" description="Manage and respond to fleet incidents">
        <Link href="/driver/incidents/new">
          <Button size="sm"><Plus className="size-4 mr-2" />Report Incident</Button>
        </Link>
      </PageHeader>

      {/* Stats KPI Row */}
      {statsData?.data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { label: "Total", value: statsData.data.total, color: "bg-muted-foreground" },
            { label: "Open", value: statsData.data.open, color: "bg-red-500" },
            { label: "Critical", value: statsData.data.critical, color: "bg-red-600" },
            { label: "Resolved Today", value: statsData.data.resolvedToday, color: "bg-emerald-500" },
            { label: "Avg Resolution", value: statsData.data.avgResolutionHours ? `${statsData.data.avgResolutionHours}h` : "-", color: "bg-blue-500" },
          ].map((kpi) => (
            <div key={kpi.label} className="text-center p-2 rounded-lg bg-card border border-border">
              <div className={cn("w-2 h-2 rounded-full mx-auto mb-1", kpi.color)} />
              <div className="text-lg font-bold tabular-nums">{kpi.value}</div>
              <div className="text-[10px] text-muted-foreground">{kpi.label}</div>
            </div>
          ))}
        </div>
      )}

      <FilterBar searchPlaceholder="Search incidents..." searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1) }}>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setPage(1) }} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
          <option value="">All Severity</option>
          <option value="P1">P1 — Critical</option>
          <option value="P2">P2 — Major</option>
          <option value="P3">P3 — Minor</option>
        </select>
      </FilterBar>

      {isLoading ? <TableSkeleton rows={5} cols={6} /> :
       isError ? <ErrorState message="Failed to load incidents" onRetry={() => refetch()} /> :
       !data?.data?.length ? <EmptyState icon={Shield} title="No incidents" description="No incidents match your filters" /> : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">ID</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Depot</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((inc: any) => (
                <TableRow key={inc.id} className={cn("group", inc.severity === "P1" && inc.status === "OPEN" && "bg-red-500/5")}>
                  <TableCell className="text-xs text-muted-foreground font-mono">{inc.id.slice(-6)}</TableCell>
                  <TableCell><Badge variant="outline" className={cn("font-bold text-xs", SEVERITY_COLORS[inc.severity as keyof typeof SEVERITY_COLORS])}>{inc.severity}</Badge></TableCell>
                  <TableCell className="text-xs">{INCIDENT_TYPE_LABELS[inc.type as keyof typeof INCIDENT_TYPE_LABELS] ?? inc.type}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {inc.severity === "P1" && inc.status === "OPEN" && <AlertTriangle className="size-4 text-red-400 animate-pulse" />}
                      <span className="text-sm font-medium truncate max-w-[200px]">{inc.title}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className={cn("text-xs", STATUS_COLORS[inc.status as keyof typeof STATUS_COLORS])}>{STATUS_LABELS[inc.status as keyof typeof STATUS_LABELS] ?? inc.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{inc.vehicleReg ?? "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{inc.depotName ?? "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(inc.createdAt), { addSuffix: true })}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100" onClick={() => { setSelectedId(inc.id); setDrawerOpen(true) }}>
                      <Eye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      <IncidentDetailDrawer incidentId={selectedId} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  )
}

function IncidentDetailDrawer({ incidentId, open, onOpenChange }: { incidentId: string | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data, isLoading } = useIncidentDetail(incidentId)
  const assignMutation = useAssignIncident()
  const transitionMutation = useTransitionStatus()
  const noteMutation = useAddNote()

  const [note, setNote] = useState("")
  const [assignId, setAssignId] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [statusNote, setStatusNote] = useState("")

  const inc = data?.data

  return (
    <SlidingDrawer open={open} onOpenChange={onOpenChange} title="Incident Details">
      {isLoading ? (
        <div className="space-y-3 p-4"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-32 w-full" /></div>
      ) : inc ? (
        <div className="space-y-4 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("font-bold", SEVERITY_COLORS[inc.severity])}>{inc.severity}</Badge>
            <Badge variant="outline" className={STATUS_COLORS[inc.status]}>{STATUS_LABELS[inc.status] ?? inc.status}</Badge>
            <Badge variant="outline">{INCIDENT_TYPE_LABELS[inc.type] ?? inc.type}</Badge>
          </div>

          <h2 className="text-lg font-semibold">{inc.title}</h2>
          <p className="text-xs text-muted-foreground">
            Reported by {inc.reportedByName ?? "Unknown"} {format(new Date(inc.createdAt), "PPP p")}
            {inc.vehicleReg && ` · Vehicle: ${inc.vehicleReg}`}
          </p>

          <div className="whitespace-pre-wrap text-sm">{inc.description}</div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-muted-foreground">Depot:</span> {inc.depotName ?? "-"}</div>
            <div><span className="text-muted-foreground">Assigned:</span> {inc.assignedToName ?? "Unassigned"}</div>
            {inc.vehicleId && (
              <div className="col-span-2">
                <Link href={`/control-room/avls/history?vehicleId=${inc.vehicleId}`} className="text-blue-400 hover:underline text-xs">
                  View vehicle around incident →
                </Link>
              </div>
            )}
          </div>

          <Separator />

          {/* Status Actions */}
          {inc.status !== "CLOSED" && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Update Status</h4>
              <div className="flex gap-2">
                <select className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="">Select...</option>
                  {(VALID_TRANSITIONS[inc.status] ?? []).map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                  ))}
                </select>
              </div>
              <Input placeholder="Required note..." value={statusNote} onChange={(e) => setStatusNote(e.target.value)} className="h-9 text-sm" />
              <Button size="sm" className="w-full" disabled={!newStatus || !statusNote || transitionMutation.isPending}
                onClick={() => transitionMutation.mutate({ id: inc.id, status: newStatus, note: statusNote }, { onSuccess: () => { setNewStatus(""); setStatusNote("") } })}>
                {transitionMutation.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                Update Status
              </Button>
            </div>
          )}

          {/* Assign */}
          {inc.status !== "CLOSED" && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Assign Incident</h4>
              <Input placeholder="User ID to assign..." value={assignId} onChange={(e) => setAssignId(e.target.value)} className="h-9 text-sm" />
              <Button size="sm" variant="outline" className="w-full" disabled={!assignId || assignMutation.isPending}
                onClick={() => assignMutation.mutate({ id: inc.id, assignedToId: assignId })}>
                <UserPlus className="size-4 mr-2" />Assign
              </Button>
            </div>
          )}

          {/* Add Note */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Add Note</h4>
            <Input placeholder="Type a note..." value={note} onChange={(e) => setNote(e.target.value)} className="h-9 text-sm" />
            <Button size="sm" variant="ghost" className="w-full" disabled={!note || noteMutation.isPending}
              onClick={() => noteMutation.mutate({ id: inc.id, note }, { onSuccess: () => setNote("") })}>
              <MessageSquare className="size-4 mr-2" />Add Note
            </Button>
          </div>

          <Separator />

          {/* Timeline */}
          {inc.timeline.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Timeline</h4>
              {inc.timeline.map((ev) => (
                <div key={ev.id} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className={cn("size-2 rounded-full mt-1.5", ev.eventType === "STATUS_CHANGE" ? "bg-blue-400" : ev.eventType === "CREATED" ? "bg-emerald-400" : "bg-muted-foreground")} />
                    <div className="w-px flex-1 bg-border" />
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs">{ev.userName}</span>
                      {ev.fromStatus && ev.toStatus && (
                        <span className="text-xs text-muted-foreground">
                          {STATUS_LABELS[ev.fromStatus as keyof typeof STATUS_LABELS] ?? ev.fromStatus} → {STATUS_LABELS[ev.toStatus as keyof typeof STATUS_LABELS] ?? ev.toStatus}
                        </span>
                      )}
                    </div>
                    {ev.note && <p className="text-xs text-muted-foreground mt-0.5">{ev.note}</p>}
                    <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(ev.createdAt), "p")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Assignment History */}
          {inc.assignmentHistory.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Assignment History</h4>
                {inc.assignmentHistory.map((a) => (
                  <div key={a.id} className="text-xs space-y-1">
                    <p><span className="text-muted-foreground">To:</span> {a.assignedToName} <span className="text-muted-foreground">by</span> {a.assignedByName}</p>
                    <p className="text-muted-foreground">{format(new Date(a.assignedAt), "P p")}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">Incident not found</p>
      )}
    </SlidingDrawer>
  )
}
