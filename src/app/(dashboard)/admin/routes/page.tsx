"use client"

import { useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/enterprise/page-header"
import { FilterBar } from "@/components/enterprise/filter-bar"
import { EmptyState } from "@/components/enterprise/empty-state"
import { ErrorState } from "@/components/enterprise/error-state"
import { TableSkeleton } from "@/components/enterprise/loading-skeletons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, MapPin, Archive, Eye } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

export default function AdminRoutesPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (statusFilter) params.set("status", statusFilter)
  params.set("page", String(page))
  params.set("limit", "15")

  const { data, isLoading, isError, refetch } = useQuery<{ success: true; data: any[]; pagination: any }>({
    queryKey: ["routes", search, statusFilter, page],
    queryFn: () => fetch(`/api/v1/scheduling/routes?${params}`).then((r) => r.json()),
  })

  return (
    <div className="space-y-4">
      <PageHeader title="Routes" description="Manage NCR transport routes and stops">
        <Link href="/admin/routes/create">
          <Button size="sm"><Plus className="size-4 mr-2" />Create Route</Button>
        </Link>
      </PageHeader>

      <FilterBar
        searchPlaceholder="Search routes..."
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
      >
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </FilterBar>

      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : isError ? (
        <ErrorState message="Failed to load routes" onRetry={() => refetch()} />
      ) : !data?.data?.length ? (
        <EmptyState icon={MapPin} title="No routes found" description="Create your first route to start managing transport schedules.">
          <Link href="/admin/routes/create"><Button size="sm"><Plus className="size-4 mr-2" />Create Route</Button></Link>
        </EmptyState>
      ) : (
        <>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Depot</TableHead>
                  <TableHead>Stops</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm font-semibold">{r.code}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{r.name}</span>
                        {r.origin && <p className="text-xs text-muted-foreground">{r.origin} → {r.destination}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.depotName ?? "-"}</TableCell>
                    <TableCell className="text-sm tabular-nums">{r.stopCount}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        r.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                        r.status === "ARCHIVED" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                        "bg-muted text-muted-foreground"
                      }>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="size-8">
                          <Eye className="size-4" />
                        </Button>
                        {r.status === "ACTIVE" && (
                          <Button variant="ghost" size="icon" className="size-8 text-amber-400">
                            <Archive className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
