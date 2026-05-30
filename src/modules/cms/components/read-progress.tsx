"use client"

import { cn } from "@/lib/utils"

interface ReadProgressProps {
  readCount: number
  totalTargets: number
  ackCount?: number
  requiresAck?: boolean
  className?: string
}

export function ReadProgress({ readCount, totalTargets, ackCount = 0, requiresAck, className }: ReadProgressProps) {
  const total = totalTargets || 1
  const readPct = Math.round((readCount / total) * 100)
  const ackPct = Math.round((ackCount / total) * 100)

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Read</span>
        <span className="font-medium tabular-nums">
          {readCount}/{totalTargets || "-"} ({readPct}%)
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${readPct}%` }}
        />
      </div>
      {requiresAck && (
        <>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Acknowledged</span>
            <span className="font-medium tabular-nums">
              {ackCount}/{totalTargets || "-"} ({ackPct}%)
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${ackPct}%` }}
            />
          </div>
        </>
      )}
    </div>
  )
}
