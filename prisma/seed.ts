import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

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
  console.log("✓ Organization created")

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
  console.log(`✓ ${depotData.length} depots created`)

  ///////////////////////////////////////////////////////////////////////////
  // USERS
  ///////////////////////////////////////////////////////////////////////////
  const passwordHash = await bcrypt.hash("password123", 12)

  interface UserSeed {
    username: string
    role: "admin" | "control_operator" | "depot_manager" | "driver" | "conductor" | "executive"
    firstName: string
    lastName: string
  }

  const users: UserSeed[] = []

  // Admins (5)
  users.push(
    { username: "admin", role: "admin", firstName: "System", lastName: "Administrator" },
    { username: "ravi.kumar", role: "admin", firstName: "Ravi", lastName: "Kumar" },
    { username: "priya.sharma", role: "admin", firstName: "Priya", lastName: "Sharma" },
    { username: "amit.singh", role: "admin", firstName: "Amit", lastName: "Singh" },
    { username: "neha.gupta", role: "admin", firstName: "Neha", lastName: "Gupta" },
  )

  // Control Operators (10)
  users.push(
    { username: "control.operator1", role: "control_operator", firstName: "Vikram", lastName: "Patel" },
    { username: "control.operator2", role: "control_operator", firstName: "Sunita", lastName: "Yadav" },
    { username: "control.operator3", role: "control_operator", firstName: "Rajesh", lastName: "Verma" },
    { username: "control.operator4", role: "control_operator", firstName: "Anita", lastName: "Joshi" },
    { username: "control.operator5", role: "control_operator", firstName: "Deepak", lastName: "Saxena" },
    { username: "control.operator6", role: "control_operator", firstName: "Meena", lastName: "Rawat" },
    { username: "control.operator7", role: "control_operator", firstName: "Suresh", lastName: "Bisht" },
    { username: "control.operator8", role: "control_operator", firstName: "Kavita", lastName: "Negi" },
    { username: "control.operator9", role: "control_operator", firstName: "Manoj", lastName: "Thakur" },
    { username: "control.operator10", role: "control_operator", firstName: "Rekha", lastName: "Chauhan" },
  )

  // Depot Managers (5, one per depot)
  const depotManagerNames = [
    { username: "dm.noida", firstName: "Arun", lastName: "Malik", depot: "NOI37" },
    { username: "dm.anandvihar", firstName: "Sanjay", lastName: "Gupta", depot: "ANV01" },
    { username: "dm.ghaziabad", firstName: "Prakash", lastName: "Tiwari", depot: "GZB01" },
    { username: "dm.meerut", firstName: "Rajendra", lastName: "Shukla", depot: "MRT01" },
    { username: "dm.duhai", firstName: "Vivek", lastName: "Mishra", depot: "DUH01" },
  ]

  for (const dm of depotManagerNames) {
    await prisma.user.create({
      data: {
        username: dm.username,
        role: "depot_manager",
        firstName: dm.firstName,
        lastName: dm.lastName,
        passwordHash,
        organizationId: organization.id,
        depotId: depots[dm.depot],
        email: `${dm.username}@ncrtc.local`,
      },
    })
  }

  // Drivers (30, spread across depots)
  const driverFirstNames = [
    "Raj", "Vijay", "Mohan", "Sohan", "Ramesh", "Dinesh", "Naresh", "Mahesh",
    "Sunil", "Anil", "Sachin", "Vinod", "Harish", "Pankaj", "Dharmendra",
    "Abhishek", "Rohit", "Nitin", "Ashok", "Karan", "Sandeep", "Mukesh",
    "Lalit", "Girish", "Pawan", "Tarun", "Rakesh", "Brijesh", "Hemant", "Vikas",
  ]
  const driverLastNames = [
    "Kumar", "Singh", "Sharma", "Yadav", "Verma", "Gupta", "Jha", "Das",
    "Pandey", "Mishra", "Tiwari", "Srivastava", "Dubey", "Shukla", "Tripathi",
  ]

  for (let i = 0; i < 30; i++) {
    const depotCodes = Object.keys(depots)
    const depotCode = depotCodes[i % depotCodes.length]
    await prisma.user.create({
      data: {
        username: `driver.${driverFirstNames[i].toLowerCase()}.${(i + 1).toString().padStart(2, "0")}`,
        role: "driver",
        firstName: driverFirstNames[i],
        lastName: driverLastNames[i % driverLastNames.length],
        passwordHash,
        organizationId: organization.id,
        depotId: depots[depotCode],
        email: `driver${i + 1}@ncrtc.local`,
        employeeId: `NCR-DRV-${(i + 1).toString().padStart(4, "0")}`,
      },
    })
  }

  // Conductors (20)
  for (let i = 0; i < 20; i++) {
    const depotCodes = Object.keys(depots)
    const depotCode = depotCodes[i % depotCodes.length]
    await prisma.user.create({
      data: {
        username: `conductor.${(i + 1).toString().padStart(2, "0")}`,
        role: "conductor",
        firstName: `Conductor${i + 1}`,
        lastName: driverLastNames[i % driverLastNames.length],
        passwordHash,
        organizationId: organization.id,
        depotId: depots[depotCode],
        email: `conductor${i + 1}@ncrtc.local`,
        employeeId: `NCR-CND-${(i + 1).toString().padStart(4, "0")}`,
      },
    })
  }

  // Executives (5)
  users.push(
    { username: "executive1", role: "executive", firstName: "Alok", lastName: "Nath" },
    { username: "executive2", role: "executive", firstName: "Shalini", lastName: "Kapoor" },
    { username: "executive3", role: "executive", firstName: "Pradeep", lastName: "Mehta" },
    { username: "executive4", role: "executive", firstName: "Ritu", lastName: "Bhatia" },
    { username: "executive5", role: "executive", firstName: "Keshav", lastName: "Agarwal" },
  )

  for (const u of users) {
    await prisma.user.create({
      data: {
        username: u.username,
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName,
        passwordHash,
        organizationId: organization.id,
        email: `${u.username}@ncrtc.local`,
      },
    })
  }

  console.log(`✓ ${users.length + depotManagerNames.length + 30 + 20} users created`)

  ///////////////////////////////////////////////////////////////////////////
  // VEHICLES (50)
  ///////////////////////////////////////////////////////////////////////////
  const vehicleTypes = ["Electric Bus", "CNG Bus", "Standard Bus", "Articulated Bus"]
  const makes = ["Tata", "Ashok Leyland", "Volvo", "Eicher"]

  for (let i = 0; i < 50; i++) {
    const depotCodes = Object.keys(depots)
    const depotCode = depotCodes[i % depotCodes.length]
    const regNum = `DL${(i + 1).toString().padStart(2, "0")}C${(1000 + i * 7).toString().padStart(4, "0")}`

    await prisma.vehicle.create({
      data: {
        registrationNumber: regNum,
        vehicleType: vehicleTypes[i % vehicleTypes.length],
        make: makes[i % makes.length],
        model: `Model-${2020 + (i % 5)}`,
        year: 2020 + (i % 5),
        capacity: 40 + (i % 3) * 10,
        status: i < 40 ? "active" : i < 45 ? "maintenance" : "inactive",
        deviceId: `GPS-${(1000 + i).toString()}`,
        depotId: depots[depotCode],
        organizationId: organization.id,
      },
    })
  }
  console.log("✓ 50 vehicles created")

  ///////////////////////////////////////////////////////////////////////////
  // STOPS (25+ realistic NCR stops)
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
      create: { ...s, organizationId: organization.id },
    })
    stopIds[s.code] = stop.id
  }
  console.log(`✓ ${stopData.length} stops created`)

  ///////////////////////////////////////////////////////////////////////////
  // ROUTES (12 realistic NCR routes with stops)
  ///////////////////////////////////////////////////////////////////////////
  const routesWithStops = [
    {
      route: { name: "Noida Sec 37 - Anand Vihar", code: "R-N2A", origin: "Noida Sector 37", destination: "Anand Vihar", depotCode: "NOI37", estimatedTimeMin: 45, distanceKm: 12.5 },
      stops: ["NOI37", "SEC18", "ATTA", "BOT01", "PRE01", "ANV01"],
    },
    {
      route: { name: "Anand Vihar - Meerut South", code: "R-A2M", origin: "Anand Vihar", destination: "Meerut South", depotCode: "ANV01", estimatedTimeMin: 120, distanceKm: 65.0 },
      stops: ["ANV01", "KAU01", "SAH01", "GZB01", "DUH01", "MUR01", "MOD01B", "MRT01"],
    },
    {
      route: { name: "Ghaziabad - Duhai", code: "R-G2D", origin: "Ghaziabad", destination: "Duhai", depotCode: "GZB01", estimatedTimeMin: 30, distanceKm: 15.0 },
      stops: ["GZB01", "RNE01", "MOH01", "DUH01"],
    },
    {
      route: { name: "Meerut South - Noida Sec 37", code: "R-M2N", origin: "Meerut South", destination: "Noida Sector 37", depotCode: "MRT01", estimatedTimeMin: 130, distanceKm: 68.0 },
      stops: ["MRT01", "PAR01", "MOD01B", "DUH01", "MOH01", "GZB01", "SAH01", "VAI01", "SEC18", "NOI37"],
    },
    {
      route: { name: "Anand Vihar - Ghaziabad", code: "R-A2G", origin: "Anand Vihar", destination: "Ghaziabad", depotCode: "ANV01", estimatedTimeMin: 35, distanceKm: 14.0 },
      stops: ["ANV01", "KAR01", "VAI01", "SAH01", "GZB01"],
    },
    {
      route: { name: "Noida City Centre - Botanical Garden", code: "R-NCB", origin: "Noida City Centre", destination: "Botanical Garden", depotCode: "NOI37", estimatedTimeMin: 20, distanceKm: 6.0 },
      stops: ["NCC01", "SEC18", "ATTA", "BOT01"],
    },
    {
      route: { name: "Duhai - Modinagar Express", code: "R-D2M", origin: "Duhai", destination: "Modinagar", depotCode: "DUH01", estimatedTimeMin: 25, distanceKm: 18.0 },
      stops: ["DUH01", "DAS01", "MUR01", "MOD01B"],
    },
    {
      route: { name: "Meerut South - Partapur Loop", code: "R-M2P", origin: "Meerut South", destination: "Partapur", depotCode: "MRT01", estimatedTimeMin: 15, distanceKm: 5.0 },
      stops: ["MRT01", "PAR01", "MOD01", "MRT01"],
    },
    {
      route: { name: "Anand Vihar - Laxmi Nagar Short", code: "R-A2L", origin: "Anand Vihar", destination: "Laxmi Nagar", depotCode: "ANV01", estimatedTimeMin: 25, distanceKm: 8.0 },
      stops: ["ANV01", "PRE01", "LAX01"],
    },
    {
      route: { name: "Sahibabad - Loni Border", code: "R-S2L", origin: "Sahibabad", destination: "Loni Border", depotCode: "GZB01", estimatedTimeMin: 40, distanceKm: 20.0 },
      stops: ["SAH01", "MOH01", "LON01"],
    },
    {
      route: { name: "Ghaziabad - Mohan Nagar Feeder", code: "R-G2M", origin: "Ghaziabad", destination: "Mohan Nagar", depotCode: "GZB01", estimatedTimeMin: 15, distanceKm: 5.0 },
      stops: ["GZB01", "RNE01", "MOH01"],
    },
    {
      route: { name: "Yamuna Bank - Karkardooma Connector", code: "R-Y2K", origin: "Yamuna Bank", destination: "Karkardooma", depotCode: "ANV01", estimatedTimeMin: 20, distanceKm: 7.0 },
      stops: ["YAM01", "LAX01", "PRE01", "KAR01"],
    },
  ]

  const routeIds: Record<string, string> = {}
  for (const rs of routesWithStops) {
    const depotId = depots[rs.route.depotCode]
    const route = await prisma.route.upsert({
      where: { code: rs.route.code },
      update: {},
      create: {
        name: rs.route.name,
        code: rs.route.code,
        origin: rs.route.origin,
        destination: rs.route.destination,
        depotId,
        estimatedTimeMin: rs.route.estimatedTimeMin,
        distanceKm: rs.route.distanceKm,
        status: "ACTIVE",
        organizationId: organization.id,
      },
    })
    routeIds[rs.route.code] = route.id

    // Create route stops
    for (let i = 0; i < rs.stops.length; i++) {
      const stopCode = rs.stops[i]
      if (stopIds[stopCode]) {
        await prisma.routeStop.upsert({
          where: { routeId_sequence: { routeId: route.id, sequence: i + 1 } },
          update: {},
          create: {
            routeId: route.id,
            stopId: stopIds[stopCode],
            sequence: i + 1,
            arrivalMin: i * (rs.route.estimatedTimeMin / rs.stops.length),
          },
        })
      }
    }
  }
  console.log(`✓ ${routesWithStops.length} routes with stops created`)

  ///////////////////////////////////////////////////////////////////////////
  // NOTICES (10 — mixed status, audience, read/ack)
  ///////////////////////////////////////////////////////////////////////////
  const adminUser = await prisma.user.findUnique({ where: { username: "admin" } })

  if (adminUser) {
    const noticeData = [
      {
        title: "Fleet Safety Protocol Update — Mandatory Review",
        content: "All drivers and conductors must review the updated safety protocol effective immediately. Key changes:\n\n1. Pre-trip vehicle inspection checklist expanded to 12 points\n2. Emergency evacuation drill now required monthly\n3. Speed limit reduced to 40 km/h in depot zones\n4. New fire extinguisher locations marked in all vehicles\n\nNon-compliance will be reported to depot managers. This is a mandatory read for all operating staff.",
        status: "PUBLISHED" as const,
        audienceJson: { type: "ALL_DRIVERS" },
        requiresAck: true,
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: "New Electric Buses Arriving — Training Schedule",
        content: "15 new Tata Ultra electric buses will be added to the Noida Sector 37 depot starting next Monday. All drivers assigned to Noida routes must complete the 2-day EV training program.\n\nTraining batches:\n- Batch A: Mon-Tue (8am-4pm)\n- Batch B: Wed-Thu (8am-4pm)\n- Batch C: Fri-Sat (8am-4pm)\n\nContact your depot manager to confirm your batch. This is mandatory for all Noida depot drivers.",
        status: "PUBLISHED" as const,
        audienceJson: { type: "DEPOT", depotIds: ["NOI37"] },
        requiresAck: true,
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Monsoon Readiness — Vehicle Checks Required",
        content: "As monsoon season approaches, all depot managers must ensure vehicles are prepared:\n\n- Wiper blades checked and replaced if worn\n- Headlights and fog lights tested\n- Tire tread depth minimum 3mm\n- Emergency kit stocked with rain gear\n- Drainage around depot parking areas cleared\n\nDaily checks start from 15th of this month.",
        status: "PUBLISHED" as const,
        audienceJson: { type: "ROLE", role: "depot_manager" },
        requiresAck: false,
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Holiday Schedule — Diwali Week Adjustments",
        content: "Due to Diwali celebrations, the following schedule adjustments apply:\n\n- Oct 28-30: Reduced fleet (60% capacity)\n- Oct 31: No service on select rural routes\n- Nov 1-2: Normal service resumes\n\nDrivers: Please confirm your availability with your depot manager by Oct 20. Overtime rates apply for holiday shifts.",
        status: "DRAFT" as const,
        audienceJson: { type: "ALL_DRIVERS" },
        requiresAck: false,
        publishedAt: null,
      },
      {
        title: "Route R-N2A Diversion — Noida Sector 37 to Anand Vihar",
        content: "Due to road construction at Sector 15, Route R-N2A (Noida Sec 37 - Anand Vihar) will be diverted via Sector 18 for the next 3 weeks.\n\nAlternate stops:\n1. Sector 18 Metro Station (temporary)\n2. Atta Market\n3. Sector 12\n\nRegular route expected to resume from the 25th of next month. All drivers on this route must note the changes.",
        status: "PUBLISHED" as const,
        audienceJson: { type: "DEPOT", depotIds: ["NOI37"] },
        requiresAck: true,
        publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Driver of the Month — Award Program Launch",
        content: "NCRTC is launching a 'Driver of the Month' recognition program starting this month.\n\nCriteria:\n- Zero accidents or incidents\n- On-time performance >95%\n- Positive passenger feedback\n- Vehicle cleanliness score >4/5\n\nWinners receive ₹5,000 bonus and certificate. Nominations open on the 1st of each month.",
        status: "PUBLISHED" as const,
        audienceJson: { type: "ALL_DRIVERS" },
        requiresAck: false,
        publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Daily Log Sheet Format Change — Effective Next Week",
        content: "Starting Monday, all drivers must use the new digital-compatible log sheet format. The old paper format will no longer be accepted.\n\nKey changes:\n- Trip start/end times in 24-hour format\n- Fuel consumption in liters (not kg)\n- Passenger count per trip segment\n- Digital submission via driver app preferred\n\nSample sheets available at depot offices.",
        status: "ARCHIVED" as const,
        audienceJson: { type: "ALL_DRIVERS" },
        requiresAck: false,
        publishedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        archivedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Test Notice — Internal QA Draft",
        content: "This is an internal draft notice for QA testing purposes. Verify that draft notices are visible only to admin users and not published to drivers. Check audience targeting and read receipts.",
        status: "DRAFT" as const,
        audienceJson: { type: "ROLE", role: "driver" },
        requiresAck: false,
        publishedAt: null,
      },
      {
        title: "COVID-19 Guidelines — Archived Reference",
        content: "Historical reference: COVID-19 safety guidelines that were in effect during the pandemic period. Masks mandatory, sanitization every 2 hours, passenger temperature checks at boarding. These guidelines have been superseded by the current health policy.",
        status: "ARCHIVED" as const,
        audienceJson: { type: "ALL_DRIVERS" },
        requiresAck: false,
        publishedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        archivedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Vehicle GPS Tracker Upgrade — Meerut Depot",
        content: "All vehicles assigned to Meerut South depot will undergo GPS tracker upgrades this weekend (Saturday 6am - Sunday 6pm). Vehicles will be temporarily unavailable during upgrade.\n\nAffected vehicle series: DL-XX-3XXX\nAlternative arrangements: Contact control room for spare vehicle assignment.",
        status: "PUBLISHED" as const,
        audienceJson: { type: "DEPOT", depotIds: ["MRT01"] },
        requiresAck: false,
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ]

    for (const nd of noticeData) {
      await prisma.notice.create({
        data: {
          title: nd.title,
          content: nd.content,
          status: nd.status,
          audienceJson: nd.audienceJson as any,
          requiresAck: nd.requiresAck,
          publishedAt: nd.publishedAt,
          archivedAt: (nd as any).archivedAt ?? null,
          organizationId: organization.id,
          authorId: adminUser.id,
        },
      })
    }

    // Create read/acknowledge records for demo purposes
    const publishedNotices = await prisma.notice.findMany({
      where: { status: "PUBLISHED" },
    })

    if (publishedNotices.length > 0) {
      const drivers = await prisma.user.findMany({
        where: { role: { in: ["driver", "conductor"] } },
        take: 20,
      })

      // For the first published notice, mark as read by most drivers
      const firstNotice = publishedNotices[0]
      for (let i = 0; i < Math.min(drivers.length, 15); i++) {
        await prisma.noticeRead.upsert({
          where: { noticeId_userId: { noticeId: firstNotice.id, userId: drivers[i].id } },
          create: {
            noticeId: firstNotice.id,
            userId: drivers[i].id,
            readAt: new Date(Date.now() - (i % 4) * 24 * 60 * 60 * 1000),
            acknowledgedAt: firstNotice.requiresAck ? new Date(Date.now() - (i % 3) * 24 * 60 * 60 * 1000) : null,
          },
          update: {},
        })
      }

      // For the second published notice, partial reads
      if (publishedNotices.length > 1) {
        const secondNotice = publishedNotices[1]
        for (let i = 0; i < Math.min(drivers.length, 8); i++) {
          await prisma.noticeRead.upsert({
            where: { noticeId_userId: { noticeId: secondNotice.id, userId: drivers[i].id } },
            create: {
              noticeId: secondNotice.id,
              userId: drivers[i].id,
              readAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000),
              acknowledgedAt: secondNotice.requiresAck && i < 5 ? new Date(Date.now() - i * 12 * 60 * 60 * 1000) : null,
            },
            update: {},
          })
        }
      }
    }
    console.log(`✓ 10 notices created with read/acknowledge demo data`)
  }

  ///////////////////////////////////////////////////////////////////////////
  // DUTIES (1 week across all depots)
  ///////////////////////////////////////////////////////////////////////////
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  // Get all drivers, conductors, vehicles per depot
  const allDrivers = await prisma.user.findMany({ where: { role: "driver", isActive: true }, select: { id: true, depotId: true } })
  const allConductors = await prisma.user.findMany({ where: { role: "conductor", isActive: true }, select: { id: true, depotId: true } })
  const allVehicles = await prisma.vehicle.findMany({ where: { status: "active" }, select: { id: true, depotId: true } })

  const driversByDepot: Record<string, string[]> = {}
  const conductorsByDepot: Record<string, string[]> = {}
  const vehiclesByDepot: Record<string, string[]> = {}

  for (const d of allDrivers) { if (d.depotId) { if (!driversByDepot[d.depotId]) driversByDepot[d.depotId] = []; driversByDepot[d.depotId].push(d.id) } }
  for (const c of allConductors) { if (c.depotId) { if (!conductorsByDepot[c.depotId]) conductorsByDepot[c.depotId] = []; conductorsByDepot[c.depotId].push(c.id) } }
  for (const v of allVehicles) { if (v.depotId) { if (!vehiclesByDepot[v.depotId]) vehiclesByDepot[v.depotId] = []; vehiclesByDepot[v.depotId].push(v.id) } }

  const routeCodesByDepot: Record<string, string[]> = {}
  for (const rs of routesWithStops) {
    const depotId = depots[rs.route.depotCode]
    if (!routeCodesByDepot[depotId]) routeCodesByDepot[depotId] = []
    routeCodesByDepot[depotId].push(rs.route.code)
  }

  let dutyCount = 0
  const depotCodes = Object.keys(depots)

  for (const depotCode of depotCodes) {
    const depotId = depots[depotCode]
    const drivers = driversByDepot[depotId] ?? []
    const conductors = conductorsByDepot[depotId] ?? []
    const vehicles = vehiclesByDepot[depotId] ?? []
    const depotRouteCodes = routeCodesByDepot[depotId] ?? []
    const depotRouteIds = depotRouteCodes.map((c) => routeIds[c]).filter(Boolean)

    if (drivers.length === 0 || vehicles.length === 0 || depotRouteIds.length === 0) continue

    // Create duties for yesterday, today, and next 5 days
    for (let dayOffset = -1; dayOffset < 6; dayOffset++) {
      const dutyDate = new Date(today)
      dutyDate.setDate(today.getDate() + dayOffset)

      // Assign duties to a subset of drivers each day
      const numDuties = Math.min(drivers.length, 5)
      for (let i = 0; i < numDuties; i++) {
        const driverId = drivers[i % drivers.length]
        const vehicleId = vehicles[i % vehicles.length]
        const routeId = depotRouteIds[i % depotRouteIds.length]
        const conductorId = conductors.length > 0 ? conductors[i % conductors.length] : null

        const startHour = 6 + (i % 3) * 4 // staggered: 6am, 10am, 2pm
        const startTime = new Date(dutyDate)
        startTime.setHours(startHour, 0, 0, 0)
        const endTime = new Date(dutyDate)
        endTime.setHours(startHour + 8, 0, 0, 0)

        let status: "DRAFT" | "PUBLISHED" | "ACKNOWLEDGED" | "COMPLETED" = "PUBLISHED"
        let publishedAt: Date | null = new Date()
        let ackAt: Date | null = null

        if (dayOffset === -1) {
          // Yesterday: completed or acknowledged
          status = i % 2 === 0 ? "COMPLETED" : "ACKNOWLEDGED"
          ackAt = new Date(dutyDate.getTime() + 2 * 60 * 60 * 1000)
        } else if (dayOffset === 6) {
          // 6 days from now: draft
          status = "DRAFT"
          publishedAt = null
        } else if (dayOffset === 0 && i === 0) {
          // First driver today: acknowledged
          status = "ACKNOWLEDGED"
          ackAt = new Date()
        } else if (dayOffset >= 3 && i % 3 === 0) {
          // Some future days: draft
          status = "DRAFT"
          publishedAt = null
        }

        await prisma.duty.create({
          data: {
            organizationId: organization.id,
            depotId,
            driverId,
            conductorId,
            vehicleId,
            routeId,
            date: dutyDate,
            startTime,
            endTime,
            status,
            publishedAt,
            ackAt,
          },
        })
        dutyCount++
      }
    }
  }
  console.log(`✓ ${dutyCount} duties created (yesterday, today, next 5 days)`)

  ///////////////////////////////////////////////////////////////////////////
  // GPS HISTORY + LIVE STATES (for AVLS demo)
  ///////////////////////////////////////////////////////////////////////////
  const yesterdayDate = new Date(yesterday)
  const todayDate = new Date(today)
  const activeVehicles = allVehicles.slice(0, 15).filter((v) => v.depotId)

  // Create GPS history for yesterday (10+ vehicles)
  let gpsCount = 0
  for (const vehicle of activeVehicles.slice(0, 12)) {
    // Get route for this vehicle's depot
    const depotRoutes = routeCodesByDepot[vehicle.depotId!] ?? []
    const routeCode = depotRoutes[gpsCount % depotRoutes.length]
    const routeId = routeCode ? routeIds[routeCode] : null

    // Get route stops for movement simulation
    let stopCoords: { lat: number; lng: number }[] = []
    if (routeId) {
      const routeStops = await prisma.routeStop.findMany({
        where: { routeId },
        include: { stop: true },
        orderBy: { sequence: "asc" },
      })
      stopCoords = routeStops.map((rs) => ({ lat: Number(rs.stop.latitude), lng: Number(rs.stop.longitude) }))
    }
    if (stopCoords.length < 2) {
      stopCoords = [
        { lat: 28.5700, lng: 77.3200 },
        { lat: 28.6500, lng: 77.3100 },
        { lat: 28.6700, lng: 77.4200 },
      ]
    }

    // Generate ~200 GPS pings over 24 hours for yesterday
    const startOfDay = new Date(yesterdayDate)
    startOfDay.setHours(6, 0, 0, 0)
    const pingsPerVehicle = 200
    const intervalMs = (14 * 60 * 60 * 1000) / pingsPerVehicle // spread over 14 hours

    for (let i = 0; i < pingsPerVehicle; i++) {
      const pingTime = new Date(startOfDay.getTime() + i * intervalMs)
      // Cycle through route stops
      const progress = (i % 100) / 100
      const totalSegments = stopCoords.length - 1
      const rawIdx = progress * totalSegments
      const segIdx = Math.floor(rawIdx)
      const segFrac = rawIdx - segIdx
      const clampedIdx = Math.min(segIdx, totalSegments - 1)

      const from = stopCoords[clampedIdx]
      const to = stopCoords[clampedIdx + 1] ?? from

      const lat = from.lat + (to.lat - from.lat) * segFrac + (Math.random() - 0.5) * 0.0005
      const lng = from.lng + (to.lng - from.lng) * segFrac + (Math.random() - 0.5) * 0.0005
      const speed = 20 + Math.random() * 30
      const heading = Math.atan2(to.lng - from.lng, to.lat - from.lat) * (180 / Math.PI)

      await prisma.gpsPing.create({
        data: {
          vehicleId: vehicle.id,
          latitude: lat,
          longitude: lng,
          speed: Math.round(speed),
          heading: Math.round(heading),
          ignition: true,
          ts: pingTime,
        },
      })
      gpsCount++
    }

    // Create trip session for yesterday
    await prisma.tripGpsSession.create({
      data: {
        vehicleId: vehicle.id,
        routeId,
        sessionStatus: "COMPLETED",
        startTime: new Date(startOfDay),
        endTime: new Date(startOfDay.getTime() + 14 * 60 * 60 * 1000),
        distanceKm: 80 + Math.random() * 120,
      },
    })
  }
  console.log(`✓ ${gpsCount} GPS history pings created (${activeVehicles.slice(0, 12).length} vehicles)`)

  // Create live states for all active vehicles (today)
  let liveStateCount = 0
  for (const vehicle of activeVehicles) {
    const routeCodes = routeCodesByDepot[vehicle.depotId!] ?? []
    const routeCode = routeCodes[liveStateCount % routeCodes.length]
    const routeId = routeCode ? routeIds[routeCode] : null

    // Get first stop coords for initial position
    let initLat = 28.65, initLng = 77.31
    if (routeId) {
      const firstStop = await prisma.routeStop.findFirst({
        where: { routeId },
        include: { stop: true },
        orderBy: { sequence: "asc" },
      })
      if (firstStop) {
        initLat = Number(firstStop.stop.latitude)
        initLng = Number(firstStop.stop.longitude)
      }
    }

    // Find driver assigned today
    const todayDuty = await prisma.duty.findFirst({
      where: {
        vehicleId: vehicle.id,
        date: { gte: todayDate },
        status: { in: ["PUBLISHED", "ACKNOWLEDGED"] },
        deletedAt: null,
      },
    })

    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        currentLatitude: initLat,
        currentLongitude: initLng,
        lastPingAt: new Date(),
      },
    })

    await prisma.vehicleLiveState.upsert({
      where: { vehicleId: vehicle.id },
      create: {
        vehicleId: vehicle.id,
        status: "ACTIVE",
        speed: 25 + Math.random() * 20,
        heading: 90,
        ignition: true,
        driverId: todayDuty?.driverId ?? null,
        routeId,
        tripStatus: "IN_PROGRESS",
        lastPingAt: new Date(),
      },
      update: {
        status: "ACTIVE",
        speed: 25 + Math.random() * 20,
        heading: 90,
        ignition: true,
        driverId: todayDuty?.driverId ?? undefined,
        routeId: routeId ?? undefined,
        tripStatus: "IN_PROGRESS",
        lastPingAt: new Date(),
      },
    })
    liveStateCount++
  }
  console.log(`✓ ${liveStateCount} vehicle live states created`)

  ///////////////////////////////////////////////////////////////////////////
  // IMS INCIDENTS (12 sample with timeline, assignments)
  ///////////////////////////////////////////////////////////////////////////
  const driverUsers = await prisma.user.findMany({ where: { role: "driver", isActive: true }, take: 15 })
  const operatorUsers = await prisma.user.findMany({ where: { role: { in: ["control_operator", "admin"] }, isActive: true }, take: 5 })
  const managerUsers = await prisma.user.findMany({ where: { role: "depot_manager", isActive: true }, take: 3 })

  // Use first 12 vehicles; for GPS coords use depot location defaults
  const sampleVehicleIds = allVehicles.slice(0, 12).map((v) => v.id)
  const defaultLatLngs: [number, number][] = [
    [28.5700, 77.3200], [28.6500, 77.3100], [28.6700, 77.4200],
    [28.9800, 77.7100], [28.7200, 77.4800], [28.5700, 77.3200],
    [28.6500, 77.3100], [28.6700, 77.4200], [28.9800, 77.7100],
    [28.7200, 77.4800], [28.5700, 77.3200], [28.6500, 77.3100],
  ]
  const sampleDepots = Object.values(depots)

  const incidentData = [
    { type: "PANIC" as const, severity: "P1" as const, title: "PANIC — Driver Distress Signal", description: "Emergency panic triggered by driver. Immediate assistance required. Vehicle stopped at roadside.", status: "OPEN" as const, vehicleIdx: 0, depotIdx: 0, driverIdx: 0 },
    { type: "BREAKDOWN" as const, severity: "P1" as const, title: "Bus Engine Failure on Route R-N2A", description: "Vehicle DL02C1007 has suffered complete engine failure near Sector 18. Passengers deboarded. Tow truck requested.", status: "IN_PROGRESS" as const, vehicleIdx: 1, depotIdx: 0, driverIdx: 1 },
    { type: "ACCIDENT" as const, severity: "P1" as const, title: "Minor Collision at Anand Vihar ISBT", description: "Bus DL03C1014 collided with a parked car while reversing at ISBT. No injuries reported. Police notified.", status: "RESOLVED" as const, vehicleIdx: 2, depotIdx: 1, driverIdx: 2 },
    { type: "COMPLAINT" as const, severity: "P2" as const, title: "Passenger Complaint — AC Not Working", description: "Multiple passengers complained about non-functional AC on bus DL05C1021. Temperature inside bus is 38°C.", status: "IN_PROGRESS" as const, vehicleIdx: 3, depotIdx: 2, driverIdx: 3 },
    { type: "BREAKDOWN" as const, severity: "P2" as const, title: "Tire Puncture — Route R-G2D", description: "Rear left tire puncture near Mohan Nagar stop. Spare tire being fitted by driver. 20 min delay expected.", status: "RESOLVED" as const, vehicleIdx: 4, depotIdx: 2, driverIdx: 4 },
    { type: "OTHER" as const, severity: "P3" as const, title: "Fare Collection Device Malfunction", description: "Electronic ticketing machine not accepting smart cards. Conductor using manual tickets.", status: "ACKNOWLEDGED" as const, vehicleIdx: 5, depotIdx: 3, driverIdx: 5 },
    { type: "ACCIDENT" as const, severity: "P2" as const, title: "Passenger Slip and Fall — Minor Injury", description: "Elderly passenger slipped while boarding at Meerut South. Minor bruising. First aid administered on site.", status: "CLOSED" as const, vehicleIdx: 6, depotIdx: 3, driverIdx: 6 },
    { type: "COMPLAINT" as const, severity: "P3" as const, title: "Route Diversion Complaint — R-M2N", description: "Passengers complaining about extended travel time due to unannounced route diversion.", status: "CLOSED" as const, vehicleIdx: 7, depotIdx: 4, driverIdx: 7 },
    { type: "BREAKDOWN" as const, severity: "P2" as const, title: "Low Oil Pressure Warning Light", description: "Dashboard warning light for low oil pressure on bus DL10C1028. Bus returned to depot for inspection.", status: "OPEN" as const, vehicleIdx: 8, depotIdx: 0, driverIdx: 8 },
    { type: "PANIC" as const, severity: "P1" as const, title: "PANIC — Medical Emergency Onboard", description: "Passenger experiencing chest pain. Bus stopped near Kaushambi Metro station. Ambulance requested.", status: "RESOLVED" as const, vehicleIdx: 9, depotIdx: 1, driverIdx: 9 },
    { type: "OTHER" as const, severity: "P3" as const, title: "Luggage Left Behind — Lost & Found", description: "Passenger reported leaving a bag on bus. Item secured by conductor and logged for return.", status: "OPEN" as const, vehicleIdx: 10, depotIdx: 2, driverIdx: 10 },
    { type: "COMPLAINT" as const, severity: "P2" as const, title: "Driver Behavior Complaint", description: "Passenger reported driver using phone while driving. Video evidence attached. Internal investigation pending.", status: "IN_PROGRESS" as const, vehicleIdx: 11, depotIdx: 4, driverIdx: 11 },
  ]

  let incidentCount = 0
  let eventCount = 0
  let assignmentCount = 0

  for (const inc of incidentData) {
    const vehicleId = sampleVehicleIds[inc.vehicleIdx]
    const depotId = sampleDepots[inc.depotIdx % sampleDepots.length]
    const reporter = driverUsers[inc.driverIdx] ?? driverUsers[0]

    const created = await prisma.incident.create({
      data: {
        organizationId: organization.id,
        type: inc.type,
        severity: inc.severity,
        title: inc.title,
        description: inc.description,
        status: inc.status,
        reportedById: reporter.id,
        vehicleId,
        depotId,
        latitude: defaultLatLngs[inc.vehicleIdx][0] + (Math.random() - 0.5) * 0.01,
        longitude: defaultLatLngs[inc.vehicleIdx][1] + (Math.random() - 0.5) * 0.01,
        ...(inc.status === "RESOLVED" || inc.status === "CLOSED" ? { resolvedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) } : {}),
      },
    })

    // Add timeline events for status progression
    await prisma.incidentEvent.create({
      data: {
        incidentId: created.id,
        userId: reporter.id,
        eventType: "CREATED",
        fromStatus: null,
        toStatus: "OPEN",
        note: `Incident reported: ${inc.title}`,
        createdAt: new Date(created.createdAt),
      },
    })
    eventCount++

    const createdTime = new Date(created.createdAt).getTime()

    if (inc.status === "ACKNOWLEDGED" || inc.status === "IN_PROGRESS" || inc.status === "RESOLVED" || inc.status === "CLOSED") {
      const ackUser = operatorUsers[incidentCount % operatorUsers.length] ?? operatorUsers[0]
      await prisma.incidentEvent.create({
        data: {
          incidentId: created.id,
          userId: ackUser.id,
          eventType: "STATUS_CHANGE",
          fromStatus: "OPEN",
          toStatus: "ACKNOWLEDGED",
          note: "Incident acknowledged and being reviewed",
          createdAt: new Date(createdTime + 10 * 60 * 1000),
        },
      })
      eventCount++

      await prisma.incidentAssignmentHistory.create({
        data: {
          incidentId: created.id,
          assignedTo: ackUser.id,
          assignedBy: ackUser.id,
          assignedAt: new Date(createdTime + 10 * 60 * 1000),
          notes: "Auto-assigned to duty operator",
        },
      })
      assignmentCount++
    }

    if (inc.status === "IN_PROGRESS" || inc.status === "RESOLVED" || inc.status === "CLOSED") {
      const progUser = managerUsers[incidentCount % managerUsers.length] ?? managerUsers[0]
      await prisma.incidentEvent.create({
        data: {
          incidentId: created.id,
          userId: progUser.id,
          eventType: "STATUS_CHANGE",
          fromStatus: "ACKNOWLEDGED",
          toStatus: "IN_PROGRESS",
          note: "Work started on resolving the incident",
          createdAt: new Date(createdTime + 60 * 60 * 1000),
        },
      })
      eventCount++
    }

    if (inc.status === "RESOLVED" || inc.status === "CLOSED") {
      const resolver = operatorUsers[(incidentCount + 1) % operatorUsers.length] ?? operatorUsers[0]
      await prisma.incidentEvent.create({
        data: {
          incidentId: created.id,
          userId: resolver.id,
          eventType: "STATUS_CHANGE",
          fromStatus: "IN_PROGRESS",
          toStatus: "RESOLVED",
          note: "Issue has been resolved. Actions taken documented.",
          createdAt: new Date(createdTime + 2 * 60 * 60 * 1000),
        },
      })
      eventCount++
    }

    if (inc.status === "CLOSED") {
      const closer = operatorUsers[0] ?? reporter
      await prisma.incidentEvent.create({
        data: {
          incidentId: created.id,
          userId: closer.id,
          eventType: "STATUS_CHANGE",
          fromStatus: "RESOLVED",
          toStatus: "CLOSED",
          note: "Resolution verified. Incident closed.",
          createdAt: new Date(createdTime + 24 * 60 * 60 * 1000),
        },
      })
      eventCount++
    }

    incidentCount++
  }
  console.log(`✓ ${incidentCount} incidents, ${eventCount} timeline events, ${assignmentCount} assignments created`)

  console.log("\n✅ Database seeding completed successfully!")
  console.log("\n📋 Demo Credentials:")
  console.log("   Username: admin")
  console.log("   Password: password123")
  console.log("\n   All users use password: password123")
  console.log("\n📋 IMS Demo Flow:")
  console.log("   1. Login as driver (driver.raj.01) → /driver/panic")
  console.log("   2. Hold panic button → P1 incident created")
  console.log("   3. Login as control operator (control.operator1) → /control-room/incidents")
  console.log("   4. View incident table with priority ordering")
  console.log("   5. Click incident → detail drawer with timeline + actions")
  console.log("   6. Assign incident → update status → resolve")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
