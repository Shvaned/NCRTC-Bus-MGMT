"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PageHeader } from "@/components/enterprise/page-header"
import { EmptyState } from "@/components/enterprise/empty-state"
import { ErrorState } from "@/components/enterprise/error-state"
import { TableSkeleton } from "@/components/enterprise/loading-skeletons"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, MessageSquare, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

export default function NotificationsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)

  const sp = new URLSearchParams({ page: String(page), limit: "30" })
  const { data, isLoading, isError, refetch } = useQuery<{ success: true; data: any[]; pagination: any }>({
    queryKey: ["notifications", page],
    queryFn: () => fetch(`/api/v1/notifications?${sp}`).then((r) => r.json()),
  })

  const markAllMutation = useMutation({
    mutationFn: () => fetch("/api/v1/notifications", { method: "PATCH" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); qc.invalidateQueries({ queryKey: ["notifications-unread-count"] }); toast.success("All marked as read") },
  })

  const notifications = data?.data ?? []

  const typeIcons: Record<string, React.ReactNode> = {
    alert: <AlertTriangle className="size-4 text-red-400" />,
    warning: <AlertTriangle className="size-4 text-amber-400" />,
    info: <Info className="size-4 text-blue-400" />,
    success: <CheckCircle className="size-4 text-emerald-400" />,
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <PageHeader title="Notifications" description="Your alerts and updates">
        {notifications.some((n: any) => !n.isRead) && (
          <Button variant="outline" size="sm" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
            <CheckCheck className="size-4 mr-2" />Mark All Read
          </Button>
        )}
      </PageHeader>

      {isLoading ? <TableSkeleton rows={5} cols={1} /> :
       isError ? <ErrorState message="Failed to load notifications" onRetry={() => refetch()} /> :
       notifications.length === 0 ? <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" /> : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <Card key={n.id} className={cn("transition-colors", !n.isRead && "border-l-2 border-l-blue-500 bg-blue-500/5")}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{typeIcons[n.type] ?? typeIcons.info}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm", !n.isRead && "font-semibold")}>{n.title}</p>
                      {!n.isRead && <div className="size-2 rounded-full bg-blue-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                      {n.actionUrl && (
                        <Link href={n.actionUrl} className="text-[10px] text-blue-400 hover:underline flex items-center gap-1">
                          View <ExternalLink className="size-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
