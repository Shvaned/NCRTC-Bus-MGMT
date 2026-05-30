"use client"

import { useState } from "react"
import { useMyNotices, useMarkRead, useAcknowledgeNotice } from "@/modules/cms/hooks/use-notices"
import { PageHeader } from "@/components/enterprise/page-header"
import { EmptyState } from "@/components/enterprise/empty-state"
import { ErrorState } from "@/components/enterprise/error-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { Megaphone, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export default function DriverNoticesPage() {
  const [page, setPage] = useState(1)
  const [selectedNotice, setSelectedNotice] = useState<any>(null)

  const { data, isLoading, isError, refetch } = useMyNotices({ page, limit: 20 })
  const markRead = useMarkRead()
  const acknowledge = useAcknowledgeNotice()

  function handleNoticeClick(notice: any) {
    setSelectedNotice(notice)
    if (!notice.isRead) {
      markRead.mutate(notice.id)
    }
  }

  if (selectedNotice) {
    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <button
          onClick={() => setSelectedNotice(null)}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          ← Back to notices
        </button>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-lg font-semibold">{selectedNotice.title}</h1>
              {selectedNotice.requiresAck && !selectedNotice.isAcknowledged && (
                <Badge variant="outline" className="gap-1 text-amber-400 border-amber-500/30 shrink-0">
                  <AlertCircle className="size-3" />
                  Action Needed
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Published {selectedNotice.publishedAt ? format(new Date(selectedNotice.publishedAt), "PPP") : "N/A"}
            </p>

            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {selectedNotice.content}
            </div>

            <div className="flex items-center gap-3 pt-2">
              {selectedNotice.isRead && (
                <div className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="size-3" />
                  Read {selectedNotice.readAt ? format(new Date(selectedNotice.readAt), "p") : ""}
                </div>
              )}
              {selectedNotice.isAcknowledged && (
                <div className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="size-3" />
                  Acknowledged
                </div>
              )}
            </div>

            {selectedNotice.requiresAck && !selectedNotice.isAcknowledged && (
              <Button
                size="sm"
                className="w-full"
                onClick={() => acknowledge.mutate(selectedNotice.id, {
                  onSuccess: () => setSelectedNotice((prev: any) => ({ ...prev, isAcknowledged: true })),
                })}
                disabled={acknowledge.isPending}
              >
                Acknowledge Notice
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <PageHeader title="Notices" description="Fleet announcements and updates" />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Failed to load notices" onRetry={() => refetch()} />
      ) : !data?.data?.length ? (
        <EmptyState
          icon={Megaphone}
          title="No Notices"
          description="You're all caught up! No notices at this time."
        />
      ) : (
        <div className="space-y-2">
          {data.data.map((notice: any) => (
            <Card
              key={notice.id}
              className={cn(
                "cursor-pointer transition-colors hover:bg-accent/50",
                !notice.isRead && "border-l-2 border-l-blue-500"
              )}
              onClick={() => handleNoticeClick(notice)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!notice.isRead && (
                        <span className="size-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                      <h3 className={cn("text-sm font-medium truncate", !notice.isRead && "font-semibold")}>
                        {notice.title}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notice.publishedAt ? format(new Date(notice.publishedAt), "dd MMM yyyy") : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {notice.requiresAck && !notice.isAcknowledged && (
                      <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30 px-1.5">
                        Ack
                      </Badge>
                    )}
                    {notice.isRead && !notice.requiresAck && (
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    )}
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
