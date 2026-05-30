import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function userUpsert(
  username: string,
  role: string,
  firstName: string,
  lastName: string,
  passwordHash: string,
  organizationId: string,
  opts?: { depotId?: string; email?: string; employeeId?: string }
) {
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    console.log(`  ↺ User already exists: ${username}`)
    return existing
  }
  return prisma.user.create({
    data: {
      username,
      role: role as any,
      firstName,
      lastName,
      passwordHash,
      organizationId,
      depotId: opts?.depotId ?? null,
      email: opts?.email ?? null,
      employeeId: opts?.employeeId ?? null,
    },
  })
}

async function main() {
  console.log("🌱 Seeding database...")

  ///////////////////////////////////////////////////////////////////////////
  // ORGANIZATION
  ///////////////////////////////////////////////////////////////////////////
  const organization = await prisma.organization.upsert({
    where: { slug: "ncrtc" },
    update: {},
    create: {
      name: "NCRTC - National Capital Region Transport Corporation",
      slug: "ncrtc",
    },
  })
  console.log("✓ Organization seeded")

  ///////////////////////////////////////////////////////////////////////////
  // DEPOTS
  ///////////////////////////////////////////////////////////////////////////
  const depotData = [
    { name: "Noida Sector 37", code: "NOI37", city: "Noida", state: "Uttar Pradesh", latitude: 28.5700, longitude: 77.3200, capacity: 80 },
    { name: "Anand Vihar", code: "ANV01", city: "Delhi", state: "Delhi", latitude: 28.6500, longitude: 77.3100, capacity: 100 },
    { name: "Ghaziabad", code: "GZB01", city: "Ghaziabad", state: "Uttar Pradesh", latitude: 28.6700, longitude: 77.4200, capacity: 60 },
    { name: "Meerut South", code: "MRT01", city: "Meerut", state: "Uttar Pradesh", latitude: 28.9800, longitude: 77.7100, capacity: 50 },
    { name: "Duhai", code: "DUH01", city: "Ghaziabad", state: "Uttar Pradesh", latitude: 28.7200, longitude: 77.4800, capacity: 40 },
  ]

  const depots: Record<string, string> = {}
  for (const d of depotData) {
    const depot = await prisma.depot.upsert({
      where: { code: d.code },
      update: {},
      create: { ...d, organizationId: organization.id },
    })
    depots[d.code] = depot.id
  }
  console.log(`✓ ${depotData.length} depots seeded`)

  ///////////////////////////////////////////////////////////////////////////
  // USERS (all with upsert via unique username)
  ///////////////////////////////////////////////////////////////////////////
  const passwordHash = await bcrypt.hash("password123", 12)
  const orgId = organization.id
  const U = (username: string, role: string, firstName: string, lastName: string, opts?: { depotId?: string; email?: string; employeeId?: string }) =>
    userUpsert(username, role, firstName, lastName, passwordHash, orgId, opts)

  // Admins
  await U("admin", "admin", "System", "Administrator")
  await U("ravi.kumar", "admin", "Ravi", "Kumar")
  await U("priya.sharma", "admin", "Priya", "Sharma")
  await U("amit.singh", "admin", "Amit", "Singh")
  await U("neha.gupta", "admin", "Neha", "Gupta")

  // Control Operators
  for (let i = 1; i <= 10; i++) {
    const names = [
      ["Vikram","Patel"],["Sunita","Yadav"],["Rajesh","Verma"],["Anita","Joshi"],["Deepak","Saxena"],
      ["Meena","Rawat"],["Suresh","Bisht"],["Kavita","Negi"],["Manoj","Thakur"],["Rekha","Chauhan"],
    ][i - 1]
    await U(`control.operator${i}`, "control_operator", names[0], names[1])
  }

  // Depot Managers
  await U("dm.noida", "depot_manager", "Arun", "Malik", { depotId: depots["NOI37"], email: "dm.noida@ncrtc.local" })
  await U("dm.anandvihar", "depot_manager", "Sanjay", "Gupta", { depotId: depots["ANV01"], email: "dm.anandvihar@ncrtc.local" })
  await U("dm.ghaziabad", "depot_manager", "Prakash", "Tiwari", { depotId: depots["GZB01"], email: "dm.ghaziabad@ncrtc.local" })
  await U("dm.meerut", "depot_manager", "Rajendra", "Shukla", { depotId: depots["MRT01"], email: "dm.meerut@ncrtc.local" })
  await U("dm.duhai", "depot_manager", "Vivek", "Mishra", { depotId: depots["DUH01"], email: "dm.duhai@ncrtc.local" })

  // Drivers (30)
  const driverFirstNames = [
    "Raj","Vijay","Mohan","Sohan","Ramesh","Dinesh","Naresh","Mahesh",
    "Sunil","Anil","Sachin","Vinod","Harish","Pankaj","Dharmendra",
    "Abhishek","Rohit","Nitin","Ashok","Karan","Sandeep","Mukesh",
    "Lalit","Girish","Pawan","Tarun","Rakesh","Brijesh","Hemant","Vikas",
  ]
  const driverLastNames = [
    "Kumar","Singh","Sharma","Yadav","Verma","Gupta","Jha","Das",
    "Pandey","Mishra","Tiwari","Srivastava","Dubey","Shukla","Tripathi",
  ]
  const depotCodes = Object.keys(depots)

  for (let i = 0; i < 30; i++) {
    const dc = depotCodes[i % depotCodes.length]
    const empId = `NCR-DRV-${(i + 1).toString().padStart(4, "0")}`
    await U(
      `driver.${driverFirstNames[i].toLowerCase()}.${(i + 1).toString().padStart(2, "0")}`,
      "driver",
      driverFirstNames[i],
      driverLastNames[i % driverLastNames.length],
      { depotId: depots[dc], email: `driver${i + 1}@ncrtc.local`, employeeId: empId }
    )
  }

  // Conductors (20)
  for (let i = 0; i < 20; i++) {
    const dc = depotCodes[i % depotCodes.length]
    const empId = `NCR-CND-${(i + 1).toString().padStart(4, "0")}`
    await U(
      `conductor.${(i + 1).toString().padStart(2, "0")}`,
      "conductor",
      `Conductor${i + 1}`,
      driverLastNames[i % driverLastNames.length],
      { depotId: depots[dc], email: `conductor${i + 1}@ncrtc.local`, employeeId: empId }
    )
  }

  // Executives
  await U("executive1", "executive", "Alok", "Nath")
  await U("executive2", "executive", "Shalini", "Kapoor")
  await U("executive3", "executive", "Pradeep", "Mehta")
  await U("executive4", "executive", "Ritu", "Bhatia")
  await U("executive5", "executive", "Keshav", "Agarwal")

  console.log(`✓ 75 users seeded (admins + operators + depot managers + drivers + conductors + executives)`)

  ///////////////////////////////////////////////////////////////////////////
  // VEHICLES (50) — upsert by registration number
  ///////////////////////////////////////////////////////////////////////////
  const vehicleTypes = ["Electric Bus", "CNG Bus", "Standard Bus", "Articulated Bus"]
  const makes = ["Tata", "Ashok Leyland", "Volvo", "Eicher"]

  for (let i = 0; i < 50; i++) {
    const dc = depotCodes[i % depotCodes.length]
    const regNum = `DL${(i + 1).toString().padStart(2, "0")}C${(1000 + i * 7).toString().padStart(4, "0")}`
    await prisma.vehicle.upsert({
      where: { registrationNumber: regNum },
      update: {},
      create: {
        registrationNumber: regNum,
        vehicleType: vehicleTypes[i % vehicleTypes.length],
        make: makes[i % makes.length],
        model: `Model-${2020 + (i % 5)}`,
        year: 2020 + (i % 5),
        capacity: 40 + (i % 3) * 10,
        status: i < 40 ? "active" : i < 45 ? "maintenance" : "inactive",
        deviceId: `GPS-${(1000 + i).toString()}`,
        depotId: depots[dc],
        organizationId: orgId,
      },
    })
  }
  console.log("✓ 50 vehicles seeded")

  ///////////////////////////////////////////////////////////////////////////
  // STOPS (25) — upsert by code
  ///////////////////////////////////////////////////////////////////////////
  const stopData = [
    { name: "Noida Sector 37 Bus Stand", code: "NOI37", address: "Sector 37, Noida", latitude: 28.5700, longitude: 77.3200 },
    { name: "Sector 18 Metro Station", code: "SEC18", address: "Sector 18, Noida", latitude: 28.5705, longitude: 77.3240 },
    { name: "Atta Market", code: "ATTA", address: "Sector 18, Noida", latitude: 28.5720, longitude: 77.3265 },
    { name: "Sector 12 Noida", code: "SEC12", address: "Sector 12, Noida", latitude: 28.5750, longitude: 77.3180 },
    { name: "Anand Vihar ISBT", code: "ANV01", address: "Anand Vihar, Delhi", latitude: 28.6500, longitude: 77.3100 },
    { name: "Kaushambi Metro", code: "KAU01", address: "Kaushambi, Ghaziabad", latitude: 28.6420, longitude: 77.3200 },
    { name: "Vaishali Metro", code: "VAI01", address: "Vaishali, Ghaziabad", latitude: 28.6480, longitude: 77.3380 },
    { name: "Mohan Nagar", code: "MOH01", address: "Mohan Nagar, Ghaziabad", latitude: 28.6800, longitude: 77.3900 },
    { name: "Duhai Depot", code: "DUH01", address: "Duhai, Ghaziabad", latitude: 28.7200, longitude: 77.4800 },
    { name: "Meerut South Bus Stand", code: "MRT01", address: "Meerut South", latitude: 28.9800, longitude: 77.7100 },
    { name: "Partapur", code: "PAR01", address: "Partapur, Meerut", latitude: 28.9900, longitude: 77.6900 },
    { name: "Modipuram", code: "MOD01", address: "Modipuram, Meerut", latitude: 29.0100, longitude: 77.6800 },
    { name: "Raj Nagar Extension", code: "RNE01", address: "Raj Nagar Ext, Ghaziabad", latitude: 28.6900, longitude: 77.4200 },
    { name: "Sahibabad", code: "SAH01", address: "Sahibabad, Ghaziabad", latitude: 28.6800, longitude: 77.3600 },
    { name: "Noida City Centre", code: "NCC01", address: "Sector 39, Noida", latitude: 28.5740, longitude: 77.3550 },
    { name: "Botanical Garden", code: "BOT01", address: "Sector 38, Noida", latitude: 28.5650, longitude: 77.3400 },
    { name: "Karkardooma", code: "KAR01", address: "Karkardooma, Delhi", latitude: 28.6550, longitude: 77.3050 },
    { name: "Preet Vihar", code: "PRE01", address: "Preet Vihar, Delhi", latitude: 28.6400, longitude: 77.2950 },
    { name: "Laxmi Nagar", code: "LAX01", address: "Laxmi Nagar, Delhi", latitude: 28.6300, longitude: 77.2800 },
    { name: "Yamuna Bank", code: "YAM01", address: "Yamuna Bank, Delhi", latitude: 28.6150, longitude: 77.2650 },
    { name: "Ghaziabad ISBT", code: "GZB01", address: "Ghaziabad Bus Stand", latitude: 28.6700, longitude: 77.4200 },
    { name: "Loni Border", code: "LON01", address: "Loni, Ghaziabad", latitude: 28.7400, longitude: 77.3000 },
    { name: "Dasna", code: "DAS01", address: "Dasna, Ghaziabad", latitude: 28.6800, longitude: 77.5300 },
    { name: "Muradnagar", code: "MUR01", address: "Muradnagar, Ghaziabad", latitude: 28.7100, longitude: 77.5400 },
    { name: "Modinagar", code: "MOD01B", address: "Modinagar, Ghaziabad", latitude: 28.8300, longitude: 77.5800 },
  ]

  const stopIds: Record<string, string> = {}
  for (const s of stopData) {
    const stop = await prisma.stop.upsert({
      where: { code: s.code },
      update: {},
      create: { ...s, organizationId: orgId },
    })
    stopIds[s.code] = stop.id
  }
  console.log(`✓ ${stopData.length} stops seeded`)

  ///////////////////////////////////////////////////////////////////////////
  // ROUTES (12) — upsert by code, routeStops upsert by routeId+sequence
  ///////////////////////////////////////////////////////////////////////////
  const routesWithStops = [
    { route: { name: "Noida Sec 37 - Anand Vihar", code: "R-N2A", origin: "Noida Sector 37", destination: "Anand Vihar", depotCode: "NOI37", estimatedTimeMin: 45, distanceKm: 12.5 }, stops: ["NOI37","SEC18","ATTA","BOT01","PRE01","ANV01"] },
    { route: { name: "Anand Vihar - Meerut South", code: "R-A2M", origin: "Anand Vihar", destination: "Meerut South", depotCode: "ANV01", estimatedTimeMin: 120, distanceKm: 65.0 }, stops: ["ANV01","KAU01","SAH01","GZB01","DUH01","MUR01","MOD01B","MRT01"] },
    { route: { name: "Ghaziabad - Duhai", code: "R-G2D", origin: "Ghaziabad", destination: "Duhai", depotCode: "GZB01", estimatedTimeMin: 30, distanceKm: 15.0 }, stops: ["GZB01","RNE01","MOH01","DUH01"] },
    { route: { name: "Meerut South - Noida Sec 37", code: "R-M2N", origin: "Meerut South", destination: "Noida Sector 37", depotCode: "MRT01", estimatedTimeMin: 130, distanceKm: 68.0 }, stops: ["MRT01","PAR01","MOD01B","DUH01","MOH01","GZB01","SAH01","VAI01","SEC18","NOI37"] },
    { route: { name: "Anand Vihar - Ghaziabad", code: "R-A2G", origin: "Anand Vihar", destination: "Ghaziabad", depotCode: "ANV01", estimatedTimeMin: 35, distanceKm: 14.0 }, stops: ["ANV01","KAR01","VAI01","SAH01","GZB01"] },
    { route: { name: "Noida City Centre - Botanical Garden", code: "R-NCB", origin: "Noida City Centre", destination: "Botanical Garden", depotCode: "NOI37", estimatedTimeMin: 20, distanceKm: 6.0 }, stops: ["NCC01","SEC18","ATTA","BOT01"] },
    { route: { name: "Duhai - Modinagar Express", code: "R-D2M", origin: "Duhai", destination: "Modinagar", depotCode: "DUH01", estimatedTimeMin: 25, distanceKm: 18.0 }, stops: ["DUH01","DAS01","MUR01","MOD01B"] },
    { route: { name: "Meerut South - Partapur Loop", code: "R-M2P", origin: "Meerut South", destination: "Partapur", depotCode: "MRT01", estimatedTimeMin: 15, distanceKm: 5.0 }, stops: ["MRT01","PAR01","MOD01","MRT01"] },
    { route: { name: "Anand Vihar - Laxmi Nagar Short", code: "R-A2L", origin: "Anand Vihar", destination: "Laxmi Nagar", depotCode: "ANV01", estimatedTimeMin: 25, distanceKm: 8.0 }, stops: ["ANV01","PRE01","LAX01"] },
    { route: { name: "Sahibabad - Loni Border", code: "R-S2L", origin: "Sahibabad", destination: "Loni Border", depotCode: "GZB01", estimatedTimeMin: 40, distanceKm: 20.0 }, stops: ["SAH01","MOH01","LON01"] },
    { route: { name: "Ghaziabad - Mohan Nagar Feeder", code: "R-G2M", origin: "Ghaziabad", destination: "Mohan Nagar", depotCode: "GZB01", estimatedTimeMin: 15, distanceKm: 5.0 }, stops: ["GZB01","RNE01","MOH01"] },
    { route: { name: "Yamuna Bank - Karkardooma Connector", code: "R-Y2K", origin: "Yamuna Bank", destination: "Karkardooma", depotCode: "ANV01", estimatedTimeMin: 20, distanceKm: 7.0 }, stops: ["YAM01","LAX01","PRE01","KAR01"] },
  ]

  const routeIds: Record<string, string> = {}
  for (const rs of routesWithStops) {
    const depotId = depots[rs.route.depotCode]
    const route = await prisma.route.upsert({
      where: { code: rs.route.code },
      update: {},
      create: {
        name: rs.route.name, code: rs.route.code,
        origin: rs.route.origin, destination: rs.route.destination,
        depotId, estimatedTimeMin: rs.route.estimatedTimeMin,
        distanceKm: rs.route.distanceKm, status: "ACTIVE", organizationId: orgId,
      },
    })
    routeIds[rs.route.code] = route.id

    for (let i = 0; i < rs.stops.length; i++) {
      const stopCode = rs.stops[i]
      if (stopIds[stopCode]) {
        await prisma.routeStop.upsert({
          where: { routeId_sequence: { routeId: route.id, sequence: i + 1 } },
          update: {},
          create: {
            routeId: route.id, stopId: stopIds[stopCode],
            sequence: i + 1, arrivalMin: i * (rs.route.estimatedTimeMin / rs.stops.length),
          },
        })
      }
    }
  }
  console.log(`✓ ${routesWithStops.length} routes with stops seeded`)

  ///////////////////////////////////////////////////////////////////////////
  // NOTICES (10) — skip if already exist for org
  ///////////////////////////////////////////////////////////////////////////
  const existingNotices = await prisma.notice.count({ where: { organizationId: orgId } })
  if (existingNotices === 0) {
    const adminUser = await prisma.user.findUnique({ where: { username: "admin" } })
    if (adminUser) {
      const noticeData = [
        { title: "Fleet Safety Protocol Update — Mandatory Review", content: "All drivers and conductors must review the updated safety protocol...", status: "PUBLISHED" as const, audienceJson: { type: "ALL_DRIVERS" }, requiresAck: true, publishedAt: new Date(Date.now() - 5 * 86400000) },
        { title: "New Electric Buses Arriving — Training Schedule", content: "15 new Tata Ultra electric buses will be added to the Noida Sector 37 depot...", status: "PUBLISHED" as const, audienceJson: { type: "DEPOT", depotIds: ["NOI37"] }, requiresAck: true, publishedAt: new Date(Date.now() - 3 * 86400000) },
        { title: "Monsoon Readiness — Vehicle Checks Required", content: "As monsoon season approaches, all depot managers must ensure vehicles are prepared...", status: "PUBLISHED" as const, audienceJson: { type: "ROLE", role: "depot_manager" }, requiresAck: false, publishedAt: new Date(Date.now() - 7 * 86400000) },
        { title: "Holiday Schedule — Diwali Week Adjustments", content: "Due to Diwali celebrations, the following schedule adjustments apply...", status: "DRAFT" as const, audienceJson: { type: "ALL_DRIVERS" }, requiresAck: false, publishedAt: null },
        { title: "Route R-N2A Diversion — Noida Sector 37 to Anand Vihar", content: "Due to road construction at Sector 15, Route R-N2A will be diverted...", status: "PUBLISHED" as const, audienceJson: { type: "DEPOT", depotIds: ["NOI37"] }, requiresAck: true, publishedAt: new Date(Date.now() - 10 * 86400000) },
        { title: "Driver of the Month — Award Program Launch", content: "NCRTC is launching a 'Driver of the Month' recognition program...", status: "PUBLISHED" as const, audienceJson: { type: "ALL_DRIVERS" }, requiresAck: false, publishedAt: new Date(Date.now() - 14 * 86400000) },
        { title: "Daily Log Sheet Format Change — Effective Next Week", content: "Starting Monday, all drivers must use the new digital-compatible log sheet format...", status: "ARCHIVED" as const, audienceJson: { type: "ALL_DRIVERS" }, requiresAck: false, publishedAt: new Date(Date.now() - 60 * 86400000), archivedAt: new Date(Date.now() - 20 * 86400000) },
        { title: "Test Notice — Internal QA Draft", content: "This is an internal draft notice for QA testing purposes...", status: "DRAFT" as const, audienceJson: { type: "ROLE", role: "driver" }, requiresAck: false, publishedAt: null },
        { title: "COVID-19 Guidelines — Archived Reference", content: "Historical reference: COVID-19 safety guidelines that were in effect...", status: "ARCHIVED" as const, audienceJson: { type: "ALL_DRIVERS" }, requiresAck: false, publishedAt: new Date(Date.now() - 180 * 86400000), archivedAt: new Date(Date.now() - 90 * 86400000) },
        { title: "Vehicle GPS Tracker Upgrade — Meerut Depot", content: "All vehicles assigned to Meerut South depot will undergo GPS tracker upgrades...", status: "PUBLISHED" as const, audienceJson: { type: "DEPOT", depotIds: ["MRT01"] }, requiresAck: false, publishedAt: new Date(Date.now() - 2 * 86400000) },
      ]

      for (const nd of noticeData) {
        await prisma.notice.create({
          data: {
            title: nd.title, content: nd.content, status: nd.status,
            audienceJson: nd.audienceJson as any, requiresAck: nd.requiresAck,
            publishedAt: nd.publishedAt, archivedAt: (nd as any).archivedAt ?? null,
            organizationId: orgId, authorId: adminUser.id,
          },
        })
      }

      // Read receipts for demo
      const publishedNotices = await prisma.notice.findMany({ where: { status: "PUBLISHED" } })
      if (publishedNotices.length > 0) {
        const drivers = await prisma.user.findMany({ where: { role: { in: ["driver", "conductor"] } }, take: 20 })
        const firstNotice = publishedNotices[0]
        for (let i = 0; i < Math.min(drivers.length, 15); i++) {
          await prisma.noticeRead.upsert({
            where: { noticeId_userId: { noticeId: firstNotice.id, userId: drivers[i].id } },
            update: {},
            create: { noticeId: firstNotice.id, userId: drivers[i].id, readAt: new Date(Date.now() - (i % 4) * 86400000), acknowledgedAt: firstNotice.requiresAck ? new Date(Date.now() - (i % 3) * 86400000) : null },
          })
        }
        if (publishedNotices.length > 1) {
          const secondNotice = publishedNotices[1]
          for (let i = 0; i < Math.min(drivers.length, 8); i++) {
            await prisma.noticeRead.upsert({
              where: { noticeId_userId: { noticeId: secondNotice.id, userId: drivers[i].id } },
              update: {},
              create: { noticeId: secondNotice.id, userId: drivers[i].id, readAt: new Date(Date.now() - i * 12 * 3600000), acknowledgedAt: secondNotice.requiresAck && i < 5 ? new Date(Date.now() - i * 12 * 3600000) : null },
            })
          }
        }
      }
      console.log("✓ 10 notices with read/acknowledge demo data")
    }
  } else {
    console.log("↺ Notices already seeded — skipping")
  }

  ///////////////////////////////////////////////////////////////////////////
  // DUTIES — skip if already exist
  ///////////////////////////////////////////////////////////////////////////
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)

  const existingDuties = await prisma.duty.count({ where: { organizationId: orgId } })
  if (existingDuties === 0) {
    const allDrivers = await prisma.user.findMany({ where: { role: "driver", isActive: true }, select: { id: true, depotId: true } })
    const allConductors = await prisma.user.findMany({ where: { role: "conductor", isActive: true }, select: { id: true, depotId: true } })
    const allVehicles = await prisma.vehicle.findMany({ where: { status: "active" }, select: { id: true, depotId: true } })

    const driversByDepot: Record<string, string[]> = {}
    const conductorsByDepot: Record<string, string[]> = {}
    const vehiclesByDepot: Record<string, string[]> = {}
    for (const d of allDrivers) { if (d.depotId) { (driversByDepot[d.depotId] ??= []).push(d.id) } }
    for (const c of allConductors) { if (c.depotId) { (conductorsByDepot[c.depotId] ??= []).push(c.id) } }
    for (const v of allVehicles) { if (v.depotId) { (vehiclesByDepot[v.depotId] ??= []).push(v.id) } }

    let dutyCount = 0
    for (const dc of depotCodes) {
      const depotId = depots[dc]
      const drivers = driversByDepot[depotId] ?? []
      const vehicles = vehiclesByDepot[depotId] ?? []
      const depotRouteCodes = (routesWithStops.filter(rs => rs.route.depotCode === dc)).map(rs => rs.route.code)
      const depotRouteIds = depotRouteCodes.map(c => routeIds[c]).filter(Boolean)
      if (drivers.length === 0 || vehicles.length === 0 || depotRouteIds.length === 0) continue

      for (let dayOff = -1; dayOff < 6; dayOff++) {
        const dutyDate = new Date(today); dutyDate.setDate(today.getDate() + dayOff)
        const numDuties = Math.min(drivers.length, 5)
        for (let i = 0; i < numDuties; i++) {
          const startHour = 6 + (i % 3) * 4
          const startTime = new Date(dutyDate); startTime.setHours(startHour, 0, 0, 0)
          const endTime = new Date(dutyDate); endTime.setHours(startHour + 8, 0, 0, 0)

          let status: "DRAFT" | "PUBLISHED" | "ACKNOWLEDGED" | "COMPLETED" = "PUBLISHED"
          let publishedAt: Date | null = new Date()
          let ackAt: Date | null = null
          if (dayOff === -1) { status = i % 2 === 0 ? "COMPLETED" : "ACKNOWLEDGED"; ackAt = new Date(dutyDate.getTime() + 2 * 3600000) }
          else if (dayOff === 6) { status = "DRAFT"; publishedAt = null }
          else if (dayOff === 0 && i === 0) { status = "ACKNOWLEDGED"; ackAt = new Date() }
          else if (dayOff >= 3 && i % 3 === 0) { status = "DRAFT"; publishedAt = null }

          await prisma.duty.create({
            data: {
              organizationId: orgId, depotId,
              driverId: drivers[i % drivers.length],
              conductorId: (conductorsByDepot[depotId] ?? [])[i % (conductorsByDepot[depotId]?.length || 1)] ?? null,
              vehicleId: vehicles[i % vehicles.length],
              routeId: depotRouteIds[i % depotRouteIds.length],
              date: dutyDate, startTime, endTime, status, publishedAt, ackAt,
            },
          })
          dutyCount++
        }
      }
    }
    console.log(`✓ ${dutyCount} duties seeded`)
  } else {
    console.log("↺ Duties already seeded — skipping")
  }

  ///////////////////////////////////////////////////////////////////////////
  // GPS HISTORY — skip if already exists
  ///////////////////////////////////////////////////////////////////////////
  const existingGpsPings = await prisma.gpsPing.count()
  if (existingGpsPings === 0) {
    const activeVehicles = (await prisma.vehicle.findMany({ where: { status: "active" }, select: { id: true, depotId: true } })).filter(v => v.depotId)
    let gpsCount = 0
    for (const vehicle of activeVehicles.slice(0, 12)) {
      const depotRoutes = routesWithStops.filter(rs => rs.route.depotCode && depots[rs.route.depotCode] === vehicle.depotId).map(rs => rs.route.code)
      const routeCode = depotRoutes[gpsCount % depotRoutes.length]
      const routeId = routeCode ? routeIds[routeCode] : null

      let stopCoords: { lat: number; lng: number }[] = [
        { lat: 28.5700, lng: 77.3200 }, { lat: 28.6500, lng: 77.3100 }, { lat: 28.6700, lng: 77.4200 },
      ]
      if (routeId) {
        const rStops = await prisma.routeStop.findMany({ where: { routeId }, include: { stop: true }, orderBy: { sequence: "asc" } })
        if (rStops.length >= 2) stopCoords = rStops.map(rs => ({ lat: Number(rs.stop.latitude), lng: Number(rs.stop.longitude) }))
      }

      const startOfDay = new Date(yesterday); startOfDay.setHours(6, 0, 0, 0)
      const pingsPerVehicle = 200
      const intervalMs = (14 * 3600000) / pingsPerVehicle
      for (let i = 0; i < pingsPerVehicle; i++) {
        const pingTime = new Date(startOfDay.getTime() + i * intervalMs)
        const progress = (i % 100) / 100
        const totalSegs = stopCoords.length - 1
        const rawIdx = progress * totalSegs
        const segIdx = Math.floor(rawIdx); const segFrac = rawIdx - segIdx
        const clampedIdx = Math.min(segIdx, totalSegs - 1)
        const from = stopCoords[clampedIdx]; const to = stopCoords[clampedIdx + 1] ?? from
        const lat = from.lat + (to.lat - from.lat) * segFrac + (Math.random() - 0.5) * 0.0005
        const lng = from.lng + (to.lng - from.lng) * segFrac + (Math.random() - 0.5) * 0.0005
        await prisma.gpsPing.create({ data: { vehicleId: vehicle.id, latitude: lat, longitude: lng, speed: Math.round(20 + Math.random() * 30), heading: Math.round(Math.atan2(to.lng - from.lng, to.lat - from.lat) * (180 / Math.PI)), ignition: true, ts: pingTime } })
        gpsCount++
      }
      await prisma.tripGpsSession.create({ data: { vehicleId: vehicle.id, routeId, sessionStatus: "COMPLETED", startTime: new Date(startOfDay), endTime: new Date(startOfDay.getTime() + 14 * 3600000), distanceKm: 80 + Math.random() * 120 } })
    }
    console.log(`✓ ${gpsCount} GPS history pings seeded`)
  } else {
    console.log("↺ GPS history already seeded — skipping")
  }

  ///////////////////////////////////////////////////////////////////////////
  // LIVE STATES — upsert by vehicleId
  ///////////////////////////////////////////////////////////////////////////
  const activeVehicles = (await prisma.vehicle.findMany({ where: { status: "active" }, select: { id: true, depotId: true } })).filter(v => v.depotId)
  let liveStateCount = 0
  for (const vehicle of activeVehicles.slice(0, 15)) {
    const depotRoutes = routesWithStops.filter(rs => rs.route.depotCode && depots[rs.route.depotCode] === vehicle.depotId).map(rs => rs.route.code)
    const routeCode = depotRoutes[liveStateCount % depotRoutes.length]
    const routeId = routeCode ? routeIds[routeCode] : null
    let initLat = 28.65, initLng = 77.31
    if (routeId) {
      const firstStop = await prisma.routeStop.findFirst({ where: { routeId }, include: { stop: true }, orderBy: { sequence: "asc" } })
      if (firstStop) { initLat = Number(firstStop.stop.latitude); initLng = Number(firstStop.stop.longitude) }
    }
    const todayDuty = await prisma.duty.findFirst({ where: { vehicleId: vehicle.id, date: { gte: today }, status: { in: ["PUBLISHED", "ACKNOWLEDGED"] }, deletedAt: null } })
    await prisma.vehicle.update({ where: { id: vehicle.id }, data: { currentLatitude: initLat, currentLongitude: initLng, lastPingAt: new Date() } })
    await prisma.vehicleLiveState.upsert({
      where: { vehicleId: vehicle.id },
      update: { status: "ACTIVE", speed: 25 + Math.random() * 20, heading: 90, ignition: true, driverId: todayDuty?.driverId ?? undefined, routeId: routeId ?? undefined, tripStatus: "IN_PROGRESS", lastPingAt: new Date() },
      create: { vehicleId: vehicle.id, status: "ACTIVE", speed: 25 + Math.random() * 20, heading: 90, ignition: true, driverId: todayDuty?.driverId ?? null, routeId, tripStatus: "IN_PROGRESS", lastPingAt: new Date() },
    })
    liveStateCount++
  }
  console.log(`✓ ${liveStateCount} vehicle live states seeded`)

  ///////////////////////////////////////////////////////////////////////////
  // IMS INCIDENTS — skip if already exist
  ///////////////////////////////////////////////////////////////////////////
  const existingIncidents = await prisma.incident.count({ where: { organizationId: orgId } })
  if (existingIncidents === 0) {
    const driverUsers = await prisma.user.findMany({ where: { role: "driver", isActive: true }, take: 15 })
    const operatorUsers = await prisma.user.findMany({ where: { role: { in: ["control_operator", "admin"] }, isActive: true }, take: 5 })
    const managerUsers = await prisma.user.findMany({ where: { role: "depot_manager", isActive: true }, take: 3 })
    const sampleVehicleIds = (await prisma.vehicle.findMany({ select: { id: true }, take: 12 })).map(v => v.id)
    const defaultLatLngs: [number, number][] = [
      [28.57,77.32],[28.65,77.31],[28.67,77.42],[28.98,77.71],[28.72,77.48],[28.57,77.32],
      [28.65,77.31],[28.67,77.42],[28.98,77.71],[28.72,77.48],[28.57,77.32],[28.65,77.31],
    ]
    const sampleDepots = Object.values(depots)

    const incidentData = [
      { type: "PANIC" as const, severity: "P1" as const, title: "PANIC — Driver Distress Signal", description: "Emergency panic triggered by driver. Immediate assistance required.", status: "OPEN" as const, vehicleIdx: 0, depotIdx: 0, driverIdx: 0 },
      { type: "BREAKDOWN" as const, severity: "P1" as const, title: "Bus Engine Failure on Route R-N2A", description: "Vehicle suffered complete engine failure near Sector 18.", status: "IN_PROGRESS" as const, vehicleIdx: 1, depotIdx: 0, driverIdx: 1 },
      { type: "ACCIDENT" as const, severity: "P1" as const, title: "Minor Collision at Anand Vihar ISBT", description: "Bus collided with parked car. No injuries.", status: "RESOLVED" as const, vehicleIdx: 2, depotIdx: 1, driverIdx: 2 },
      { type: "COMPLAINT" as const, severity: "P2" as const, title: "Passenger Complaint — AC Not Working", description: "Non-functional AC. Temperature inside bus is 38°C.", status: "IN_PROGRESS" as const, vehicleIdx: 3, depotIdx: 2, driverIdx: 3 },
      { type: "BREAKDOWN" as const, severity: "P2" as const, title: "Tire Puncture — Route R-G2D", description: "Rear left tire puncture near Mohan Nagar. 20 min delay.", status: "RESOLVED" as const, vehicleIdx: 4, depotIdx: 2, driverIdx: 4 },
      { type: "OTHER" as const, severity: "P3" as const, title: "Fare Collection Device Malfunction", description: "Electronic ticketing machine not accepting smart cards.", status: "ACKNOWLEDGED" as const, vehicleIdx: 5, depotIdx: 3, driverIdx: 5 },
      { type: "ACCIDENT" as const, severity: "P2" as const, title: "Passenger Slip and Fall — Minor Injury", description: "Elderly passenger slipped while boarding. First aid given.", status: "CLOSED" as const, vehicleIdx: 6, depotIdx: 3, driverIdx: 6 },
      { type: "COMPLAINT" as const, severity: "P3" as const, title: "Route Diversion Complaint — R-M2N", description: "Passengers complaining about unannounced diversion.", status: "CLOSED" as const, vehicleIdx: 7, depotIdx: 4, driverIdx: 7 },
      { type: "BREAKDOWN" as const, severity: "P2" as const, title: "Low Oil Pressure Warning Light", description: "Dashboard warning light. Bus returned to depot.", status: "OPEN" as const, vehicleIdx: 8, depotIdx: 0, driverIdx: 8 },
      { type: "PANIC" as const, severity: "P1" as const, title: "PANIC — Medical Emergency Onboard", description: "Passenger chest pain. Ambulance requested.", status: "RESOLVED" as const, vehicleIdx: 9, depotIdx: 1, driverIdx: 9 },
      { type: "OTHER" as const, severity: "P3" as const, title: "Luggage Left Behind — Lost & Found", description: "Passenger left bag on bus. Item secured by conductor.", status: "OPEN" as const, vehicleIdx: 10, depotIdx: 2, driverIdx: 10 },
      { type: "COMPLAINT" as const, severity: "P2" as const, title: "Driver Behavior Complaint", description: "Passenger reported driver using phone. Investigation pending.", status: "IN_PROGRESS" as const, vehicleIdx: 11, depotIdx: 4, driverIdx: 11 },
    ]

    let incidentCount = 0, eventCount = 0, assignmentCount = 0
    for (const inc of incidentData) {
      const vehicleId = sampleVehicleIds[inc.vehicleIdx]
      const depotId = sampleDepots[inc.depotIdx % sampleDepots.length]
      const reporter = driverUsers[inc.driverIdx] ?? driverUsers[0]

      const created = await prisma.incident.create({
        data: {
          organizationId: orgId, type: inc.type, severity: inc.severity,
          title: inc.title, description: inc.description, status: inc.status,
          reportedById: reporter.id, vehicleId, depotId,
          latitude: defaultLatLngs[inc.vehicleIdx][0] + (Math.random() - 0.5) * 0.01,
          longitude: defaultLatLngs[inc.vehicleIdx][1] + (Math.random() - 0.5) * 0.01,
          ...(inc.status === "RESOLVED" || inc.status === "CLOSED" ? { resolvedAt: new Date(Date.now() - Math.random() * 7 * 86400000) } : {}),
        },
      })
      eventCount++

      // CREATED event
      await prisma.incidentEvent.create({ data: { incidentId: created.id, userId: reporter.id, eventType: "CREATED", fromStatus: null, toStatus: "OPEN", note: `Incident reported: ${inc.title}`, createdAt: new Date(created.createdAt) } })
      const ct = new Date(created.createdAt).getTime()

      if (["ACKNOWLEDGED","IN_PROGRESS","RESOLVED","CLOSED"].includes(inc.status)) {
        const ackUser = operatorUsers[incidentCount % operatorUsers.length] ?? operatorUsers[0]
        await prisma.incidentEvent.create({ data: { incidentId: created.id, userId: ackUser.id, eventType: "STATUS_CHANGE", fromStatus: "OPEN", toStatus: "ACKNOWLEDGED", note: "Incident acknowledged", createdAt: new Date(ct + 10 * 60000) } })
        await prisma.incidentAssignmentHistory.create({ data: { incidentId: created.id, assignedTo: ackUser.id, assignedBy: ackUser.id, assignedAt: new Date(ct + 10 * 60000), notes: "Auto-assigned" } })
        eventCount++; assignmentCount++
      }
      if (["IN_PROGRESS","RESOLVED","CLOSED"].includes(inc.status)) {
        const progUser = managerUsers[incidentCount % managerUsers.length] ?? managerUsers[0]
        await prisma.incidentEvent.create({ data: { incidentId: created.id, userId: progUser.id, eventType: "STATUS_CHANGE", fromStatus: "ACKNOWLEDGED", toStatus: "IN_PROGRESS", note: "Work started", createdAt: new Date(ct + 60 * 60000) } })
        eventCount++
      }
      if (["RESOLVED","CLOSED"].includes(inc.status)) {
        const resolver = operatorUsers[(incidentCount + 1) % operatorUsers.length] ?? operatorUsers[0]
        await prisma.incidentEvent.create({ data: { incidentId: created.id, userId: resolver.id, eventType: "STATUS_CHANGE", fromStatus: "IN_PROGRESS", toStatus: "RESOLVED", note: "Issue resolved", createdAt: new Date(ct + 2 * 3600000) } })
        eventCount++
      }
      if (inc.status === "CLOSED") {
        await prisma.incidentEvent.create({ data: { incidentId: created.id, userId: operatorUsers[0]?.id ?? reporter.id, eventType: "STATUS_CHANGE", fromStatus: "RESOLVED", toStatus: "CLOSED", note: "Resolution verified. Incident closed.", createdAt: new Date(ct + 24 * 3600000) } })
        eventCount++
      }
      incidentCount++
    }
    console.log(`✓ ${incidentCount} incidents, ${eventCount} timeline events, ${assignmentCount} assignments seeded`)
  } else {
    console.log("↺ Incidents already seeded — skipping")
  }

  console.log("\n✅ Database seeding completed successfully!")
  console.log("\n📋 Demo Credentials:")
  console.log("   Username: admin")
  console.log("   Password: password123")
  console.log("   All users use password: password123")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
