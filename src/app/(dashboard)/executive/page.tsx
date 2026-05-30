"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PageHeader } from "@/components/enterprise/page-header"
import { KPICard } from "@/components/enterprise/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/enterprise/error-state"
import { Bus, CheckCircle, AlertTriangle, TrendingUp, BarChart3, Clock } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts"

const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#6b7280"]

export default function ExecutiveDashboard() {
  const [selectedDepot, setSelectedDepot] = useState("")

  const { data: fleetData } = useQuery<{ success: true; data: any }>({
    queryKey: ["reporting-fleet"],
    queryFn: () => fetch("/api/v1/reporting/fleet").then((r) => r.json()),
  })

  const { data: incidentData } = useQuery<{ success: true; data: any }>({
    queryKey: ["reporting-incidents"],
    queryFn: () => fetch("/api/v1/reporting/incidents").then((r) => r.json()),
  })

  const { data: depotData } = useQuery<{ success: true; data: any[] }>({
    queryKey: ["reporting-depot-summary"],
    queryFn: () => fetch("/api/v1/reporting/depot-summary").then((r) => r.json()),
  })

  const { data: dailyData } = useQuery<{ success: true; data: any }>({
    queryKey: ["reporting-daily", selectedDepot],
    queryFn: () => fetch(`/api/v1/reporting/daily${selectedDepot ? `?depotId=${selectedDepot}` : ""}`).then((r) => r.json()),
  })

  const fleet = fleetData?.data
  const incidents = incidentData?.data
  const depots = depotData?.data ?? []
  const daily = dailyData?.data

  return (
    <div className="space-y-6">
      <PageHeader title="Executive Dashboard" description="Fleet-wide analytics and performance metrics">
        <select
          value={selectedDepot}
          onChange={(e) => setSelectedDepot(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All Depots</option>
          {depots.map((d: any) => (
            <option key={d.depotId} value={d.depotId}>{d.depotName}</option>
          ))}
        </select>
      </PageHeader>

      {/* Top KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Fleet" value={fleet?.total ?? 0} subtitle="All depots" icon={Bus} trend="up" trendValue={fleet?.activePercent ? `${fleet.activePercent}% active` : undefined} />
        <KPICard title="Active Buses" value={fleet?.active ?? 0} subtitle="On road" icon={TrendingUp} />
        <KPICard title="Incidents Today" value={incidents?.today ?? 0} subtitle={`${incidents?.critical ?? 0} critical`} icon={AlertTriangle} trend={incidents?.critical > 0 ? "up" : undefined} />
        <KPICard title="Duty Completion" value={fleet?.dutyCompletionPercent ? `${fleet.dutyCompletionPercent}%` : "-"} subtitle="Today" icon={CheckCircle} />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Fleet Utilization Trend */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Fleet Utilization (7 Days)</CardTitle></CardHeader>
          <CardContent>
            {daily?.utilization ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={daily.utilization}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="active" fill="#22c55e" name="Active" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total" fill="#374151" name="Total" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-[250px] w-full" />}
          </CardContent>
        </Card>

        {/* Incident Breakdown by Severity */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Incident Breakdown</CardTitle></CardHeader>
          <CardContent>
            {incidents?.bySeverity ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={incidents.bySeverity} dataKey="count" nameKey="severity" cx="50%" cy="50%" outerRadius={90} innerRadius={50} label={({ severity, count }: any) => `${severity}: ${count}`}>
                    {incidents.bySeverity.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-[250px] w-full" />}
          </CardContent>
        </Card>

        {/* Duty Completion Trend */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Duty Completion Trend</CardTitle></CardHeader>
          <CardContent>
            {daily?.dutyCompletion ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={daily.dutyCompletion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} name="Completed" dot={false} />
                  <Line type="monotone" dataKey="total" stroke="#6b7280" strokeWidth={2} name="Total" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-[250px] w-full" />}
          </CardContent>
        </Card>

        {/* Depot Performance Comparison */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Depot Performance</CardTitle></CardHeader>
          <CardContent>
            {depots.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={depots} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="depotName" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={80} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="activeVehicles" fill="#22c55e" name="Active Vehicles" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="totalVehicles" fill="#374151" name="Total Vehicles" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-[250px] w-full" />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
