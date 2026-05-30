import { db } from "@/lib/db"

export const reportingService = {
  async getDailyReport(organizationId: string, depotId?: string) {
    const vehicleWhere = { organizationId, deletedAt: null, ...(depotId ? { depotId } : {}) }
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get the last 7 days
    const dates: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      dates.push(d.toISOString().split("T")[0])
    }

    // Fleet utilization per day
    const utilization = await Promise.all(
      dates.map(async (date) => {
        const d = new Date(date)
        const dEnd = new Date(date)
        dEnd.setHours(23, 59, 59, 999)

        const [total, activeDuties] = await Promise.all([
          db.vehicle.count({ where: vehicleWhere }),
          db.duty.count({
            where: {
              organizationId,
              date: { gte: d, lte: dEnd },
              status: { in: ["PUBLISHED", "ACKNOWLEDGED", "COMPLETED"] },
              deletedAt: null,
              ...(depotId ? { depotId } : {}),
            },
          }),
        ])

        return { date, total, active: activeDuties }
      })
    )

    // Duty completion
    const dutyCompletion = await Promise.all(
      dates.map(async (date) => {
        const d = new Date(date)
        const dEnd = new Date(date)
        dEnd.setHours(23, 59, 59, 999)

        const [total, completed] = await Promise.all([
          db.duty.count({
            where: { organizationId, date: { gte: d, lte: dEnd }, deletedAt: null, ...(depotId ? { depotId } : {}) },
          }),
          db.duty.count({
            where: { organizationId, date: { gte: d, lte: dEnd }, status: "COMPLETED", deletedAt: null, ...(depotId ? { depotId } : {}) },
          }),
        ])

        return { date, total, completed }
      })
    )

    return { utilization, dutyCompletion }
  },

  async getIncidentReport(organizationId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [total, todayCount, critical, bySeverity, byType] = await Promise.all([
      db.incident.count({ where: { organizationId, deletedAt: null } }),
      db.incident.count({ where: { organizationId, deletedAt: null, createdAt: { gte: today } } }),
      db.incident.count({ where: { organizationId, deletedAt: null, severity: "P1", status: { not: "CLOSED" } } }),
      // Group by severity
      Promise.all(["P1", "P2", "P3"].map(async (sev) => {
        const count = await db.incident.count({ where: { organizationId, deletedAt: null, severity: sev as any } })
        return { severity: sev, count }
      })),
      // Group by type
      Promise.all(["BREAKDOWN", "ACCIDENT", "COMPLAINT", "PANIC", "OTHER"].map(async (t) => {
        const count = await db.incident.count({ where: { organizationId, deletedAt: null, type: t as any } })
        return { type: t, count }
      })),
    ])

    return { total, today: todayCount, critical, bySeverity, byType }
  },

  async getFleetReport(organizationId: string) {
    const [total, active, maintenance, dutiesToday, completedDuties] = await Promise.all([
      db.vehicle.count({ where: { organizationId, deletedAt: null } }),
      db.vehicle.count({ where: { organizationId, deletedAt: null, status: "active" } }),
      db.vehicle.count({ where: { organizationId, deletedAt: null, status: "maintenance" } }),
      db.duty.count({
        where: {
          organizationId,
          date: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lte: new Date(new Date().setHours(23, 59, 59, 999)) },
          deletedAt: null,
        },
      }),
      db.duty.count({
        where: {
          organizationId,
          date: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lte: new Date(new Date().setHours(23, 59, 59, 999)) },
          status: { in: ["COMPLETED", "ACKNOWLEDGED"] },
          deletedAt: null,
        },
      }),
    ])

    const activePercent = total > 0 ? Math.round((active / total) * 100) : 0
    const dutyCompletionPercent = dutiesToday > 0 ? Math.round((completedDuties / dutiesToday) * 100) : 0

    return { total, active, maintenance, activePercent, dutiesToday, completedDuties, dutyCompletionPercent }
  },

  async getDepotSummary(organizationId: string) {
    const depots = await db.depot.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, name: true },
    })

    return Promise.all(
      depots.map(async (depot) => {
        const [totalVehicles, activeVehicles, dutiesToday, openIncidents] = await Promise.all([
          db.vehicle.count({ where: { depotId: depot.id, deletedAt: null } }),
          db.vehicle.count({ where: { depotId: depot.id, status: "active", deletedAt: null } }),
          db.duty.count({
            where: {
              depotId: depot.id,
              date: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lte: new Date(new Date().setHours(23, 59, 59, 999)) },
              deletedAt: null,
            },
          }),
          db.incident.count({
            where: { depotId: depot.id, status: "OPEN", deletedAt: null },
          }),
        ])

        return { depotId: depot.id, depotName: depot.name, totalVehicles, activeVehicles, dutiesToday, openIncidents }
      })
    )
  },
}
