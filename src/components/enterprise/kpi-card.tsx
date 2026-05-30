"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: "up" | "down"
  trendValue?: string
  className?: string
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, trendValue, className }: KPICardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                {trend === "up" ? (
                  <TrendingUp className="size-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="size-3 text-red-500" />
                )}
                <span className={cn("text-xs", trend === "up" ? "text-emerald-500" : "text-red-500")}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="rounded-lg bg-primary/10 p-2">
              <Icon className="size-5 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
