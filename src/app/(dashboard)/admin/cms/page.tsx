"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { useNotices, usePublishNotice, useArchiveNotice } from "@/modules/cms/hooks/use-notices"
import { NoticeStatusBadge } from "@/modules/cms/components/notice-status-badge"
import { AudienceBadge } from "@/modules/cms/components/audience-badge"
import { ReadProgress } from "@/modules/cms/components/read-progress"
import { PageHeader } from "@/components/enterprise/page-header"
import { FilterBar } from "@/components/enterprise/filter-bar"
import { EmptyState } from "@/components/enterprise/empty-state"
import { ErrorState } from "@/components/enterprise/error-state"
import { TableSkeleton } from "@/components/enterprise/loading-skeletons"
import { SlidingDrawer } from "@/components/enterprise/sliding-drawer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Plus, Eye, Send, Archive, FileText, Megaphone, CheckCircle } from "lucide-react"

export default function AdminCMSPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data, isLoading, isError, refetch } = useNotices({ search, status: statusFilter, page, limit: 15 })
  const publishMutation = usePublishNotice()
  const archiveMutation = useArchiveNotice()

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notice Management"
        description="Create, publish, and track fleet-wide notices"
      >
        <Link href="/admin/cms/create">
          <Button size="sm">
            <Plus className="size-4 mr-2" />
            Create Notice
          </Button>
        </Link>
      </PageHeader>

      <FilterBar
        searchPlaceholder="Search notices..."
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
      >
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </FilterBar>

      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : isError ? (
        <ErrorState message="Failed to load notices" onRetry={() => refetch()} />
      ) : !data?.data?.length ? (
        <EmptyState
          icon={Megaphone}
          title="No notices found"
          description="Create your first notice to communicate with drivers and conductors."
        >
          <Link href="/admin/cms/create">
            <Button size="sm">
              <Plus className="size-4 mr-2" />
              Create Notice
            </Button>
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Read Progress</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((notice) => (
                  <TableRow key={notice.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate max-w-[240px]">{notice.title}</span>
                      </div>
                    </TableCell>
                    <TableCell><NoticeStatusBadge status={notice.status} /></TableCell>
                    <TableCell><AudienceBadge audience={notice.audienceJson} /></TableCell>
                    <TableCell>
                      <ReadProgress
                        readCount={notice.readCount}
                        totalTargets={notice.totalTargets || notice.readCount || 0}
                        ackCount={notice.ackCount}
                        requiresAck={notice.requiresAck}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {notice.publishedAt ? format(new Date(notice.publishedAt), "dd MMM yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => { setSelectedId(notice.id); setDrawerOpen(true) }}
                        >
                          <Eye className="size-4" />
                        </Button>
                        {notice.status === "DRAFT" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-emerald-400"
                            onClick={() => publishMutation.mutate(notice.id)}
                          >
                            <Send className="size-4" />
                          </Button>
                        )}
                        {(notice.status === "PUBLISHED") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-amber-400"
                            onClick={() => archiveMutation.mutate(notice.id)}
                          >
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

          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.totalPages}
                {" "}({data.pagination.total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <NoticeDetailDrawer
        noticeId={selectedId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  )
}

function NoticeDetailDrawer({
  noticeId,
  open,
  onOpenChange,
}: {
  noticeId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data, isLoading } = useQuery<{ success: true; data: any }>({
    queryKey: ["notice", noticeId],
    queryFn: () => fetch(`/api/v1/cms/notices/${noticeId}`).then((r) => r.json()),
    enabled: open && !!noticeId,
  })

  const receiptQuery = useQuery<{ success: true; data: any[] }>({
    queryKey: ["read-receipts", noticeId],
    queryFn: () => fetch(`/api/v1/cms/notices/${noticeId}/read-receipts`).then((r) => r.json()),
    enabled: open && !!noticeId,
  })

  return (
    <SlidingDrawer open={open} onOpenChange={onOpenChange} title="Notice Details">
      {isLoading ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : data?.data ? (
        <div className="space-y-4 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <NoticeStatusBadge status={data.data.status} />
            <AudienceBadge audience={data.data.audienceJson} />
            {data.data.requiresAck && (
              <Badge variant="outline" className="gap-1 text-amber-400 border-amber-500/30">
                Requires Ack
              </Badge>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold">{data.data.title}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              By {data.data.authorName}
              {data.data.publishedAt && ` · Published ${format(new Date(data.data.publishedAt), "PPP")}`}
            </p>
          </div>

          <div className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
            {data.data.content}
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-2">Read Progress</h4>
            <ReadProgress
              readCount={data.data.readCount}
              totalTargets={data.data.readCount || 0}
              ackCount={data.data.ackCount}
              requiresAck={data.data.requiresAck}
            />
          </div>

          {receiptQuery.data?.data && receiptQuery.data.data.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Read Receipts</h4>
                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Depot</TableHead>
                        <TableHead>Read</TableHead>
                        <TableHead>Acknowledged</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receiptQuery.data.data.map((r: any) => (
                        <TableRow key={r.userId}>
                          <TableCell className="text-sm">{r.userName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.depotName ?? "-"}</TableCell>
                          <TableCell>
                            {r.isRead ? (
                              <CheckCircle className="size-4 text-emerald-400" />
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {r.isAcknowledged ? (
                              <CheckCircle className="size-4 text-emerald-400" />
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">Notice not found</p>
      )}
    </SlidingDrawer>
  )
}
