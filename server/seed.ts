import { getDb } from './database.js';
import { v4 as uuidv4 } from 'uuid';

export async function seedDatabase() {
  const db = getDb();

  const result = await db.all('SELECT count(*) as count FROM projects');
  const projectCount = result[0];

  if (projectCount && (projectCount.count > 0 || projectCount.count === '1')) { // Postgres count might be string
    console.log('Database already seeded');
    return;
  }

  console.log('Seeding database...');

  const projects = [
    {
      id: 'p1',
      companyId: 'c1',
      name: 'City Centre Plaza Development',
      code: 'CCP-2025',
      description: 'A mixed-use development featuring 40 stories of office space and a luxury retail podium.',
      location: 'Downtown Metro',
      type: 'Commercial',
      status: 'Active',
      health: 'Good',
      progress: 74,
      budget: 25000000,
      spent: 18500000,
      startDate: '2025-01-15',
      endDate: '2026-12-31',
      manager: 'John Anderson',
      image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      teamSize: 24,
      weatherLocation: JSON.stringify({ city: 'New York', temp: '72°', condition: 'Sunny' }),
      aiAnalysis: 'Project is progressing ahead of schedule. Structural steel completion is imminent.'
    },
    {
      id: 'p2',
      companyId: 'c1',
      name: 'Residential Complex - Phase 2',
      code: 'RCP-002',
      description: 'Three tower residential complex with 400 units and shared amenities.',
      location: 'Westside Heights',
      type: 'Residential',
      status: 'Active',
      health: 'At Risk',
      progress: 45,
      budget: 18000000,
      spent: 16500000,
      startDate: '2025-02-01',
      endDate: '2025-11-30',
      manager: 'Sarah Mitchell',
      image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      teamSize: 18,
      weatherLocation: JSON.stringify({ city: 'Chicago', temp: '65°', condition: 'Windy' })
    }
  ];

  for (const p of projects) {
    await db.run(
      `INSERT INTO projects (id, companyId, name, code, description, location, type, status, health, progress, budget, spent, startDate, endDate, manager, image, teamSize, weatherLocation, aiAnalysis, zones, phases, timelineOptimizations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.companyId, p.name, p.code, p.description, p.location, p.type, p.status, p.health, p.progress, p.budget, p.spent, p.startDate, p.endDate, p.manager, p.image, p.teamSize, p.weatherLocation, p.aiAnalysis, '[]', '[]', '[]']
    );
  }

  const tasks = [
    { id: 't1', title: 'Safety inspection - Site A', description: 'Conduct full perimeter safety check.', projectId: 'p1', status: 'To Do', priority: 'High', assigneeId: 'u1', assigneeName: 'Mike Thompson', assigneeType: 'user', dueDate: '2025-11-12', latitude: 40.7128, longitude: -74.0060, dependencies: '[]' },
    { id: 't2', title: 'Concrete pouring - Level 2', description: 'Pour and finish slab for level 2 podium.', projectId: 'p1', status: 'Blocked', priority: 'Critical', assigneeId: 'role-operative', assigneeName: 'All Operatives', assigneeType: 'role', dueDate: '2025-11-20', latitude: 40.7135, longitude: -74.0055, dependencies: '["t1"]' }
  ];

  for (const t of tasks) {
    await db.run(
      `INSERT INTO tasks (id, title, description, projectId, status, priority, assigneeId, assigneeName, assigneeType, dueDate, latitude, longitude, dependencies)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.title, t.description, t.projectId, t.status, t.priority, t.assigneeId, t.assigneeName, t.assigneeType, t.dueDate, t.latitude, t.longitude, t.dependencies]
    );
  }

  // --- Additional Seeds ---

  const rfis = [
    { id: 'rfi-1', projectId: 'p1', number: 'RFI-001', subject: 'Clarification on Curtain Wall Anchors', question: 'The specs for anchors on level 4 seem to conflict with structural drawings.', assignedTo: 'Sarah Mitchell', status: 'Open', dueDate: '2025-11-15', createdAt: '2025-11-08' },
    { id: 'rfi-2', projectId: 'p1', number: 'RFI-002', subject: 'Lobby Flooring Material', question: 'Is the marble finish confirmed for the main entrance?', answer: 'Yes, specs confirmed in Rev 3.', assignedTo: 'John Anderson', status: 'Closed', dueDate: '2025-10-30', createdAt: '2025-10-25' },
  ];

  for (const r of rfis) {
    await db.run(
      `INSERT INTO rfis (id, projectId, number, subject, question, answer, assignedTo, status, dueDate, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.projectId, r.number, r.subject, r.question, r.answer, r.assignedTo, r.status, r.dueDate, r.createdAt]
    );
  }

  const punchItems = [
    { id: 'pi-1', projectId: 'p1', title: 'Paint scratch in hallway', location: 'Level 3, Corridor B', description: 'Minor scuff marks on north wall.', status: 'Open', priority: 'Low', assignedTo: 'David Chen', createdAt: '2025-11-09' },
    { id: 'pi-2', projectId: 'p1', title: 'Loose electrical socket', location: 'Unit 402', description: 'Socket not flush with wall.', status: 'Resolved', priority: 'Medium', assignedTo: 'Robert Garcia', createdAt: '2025-11-05' },
  ];

  for (const p of punchItems) {
    await db.run(
      `INSERT INTO punch_items (id, projectId, title, location, description, status, priority, assignedTo, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.projectId, p.title, p.location, p.description, p.status, p.priority, p.assignedTo, p.createdAt]
    );
  }

  const dailyLogs = [
    { id: 'dl-1', projectId: 'p1', date: '2025-11-10', weather: 'Sunny, 72°F', notes: 'Site visit by inspectors went well.', workPerformed: 'Concrete pouring on sector 4 completed.', crewCount: 18, author: 'Mike Thompson', createdAt: '2025-11-10' },
    { id: 'dl-2', projectId: 'p1', date: '2025-11-09', weather: 'Cloudy, 68°F', notes: 'Delay in steel delivery caused 2h downtime.', workPerformed: 'Formwork setup for Level 5.', crewCount: 22, author: 'Mike Thompson', createdAt: '2025-11-09' },
  ];

  for (const d of dailyLogs) {
    await db.run(
      `INSERT INTO daily_logs (id, projectId, date, weather, notes, workPerformed, crewCount, author, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.id, d.projectId, d.date, d.weather, d.notes, d.workPerformed, d.crewCount, d.author, d.createdAt]
    );
  }

  const dayworks = [
    {
        id: 'dw-1', projectId: 'p1', date: '2025-11-08', description: 'Emergency cleanup after storm. Removed debris from north access road to allow delivery trucks.', status: 'Approved', createdAt: '2025-11-08',
        labor: JSON.stringify([{ name: 'Adrian', trade: 'Laborer', hours: 12, rate: 30 }]),
        materials: JSON.stringify([{ item: 'Sandbags', quantity: 50, unit: 'bags', cost: 5.50 }]),
        attachments: '[]',
        totalLaborCost: 360,
        totalMaterialCost: 275,
        grandTotal: 635
    },
    {
        id: 'dw-2', projectId: 'p1', date: '2025-11-10', description: 'Extra excavation for utility line reroute due to unforeseen obstruction.', status: 'Pending', createdAt: '2025-11-10',
        labor: JSON.stringify([{ name: 'Team A', trade: 'Groundworks', hours: 8, rate: 45 }]),
        materials: JSON.stringify([{ item: 'Gravel', quantity: 2, unit: 'ton', cost: 80 }]),
        attachments: '[]',
        totalLaborCost: 360,
        totalMaterialCost: 160,
        grandTotal: 520
    },
  ];

  for (const dw of dayworks) {
    await db.run(
      `INSERT INTO dayworks (id, projectId, date, description, status, createdAt, labor, materials, attachments, totalLaborCost, totalMaterialCost, grandTotal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [dw.id, dw.projectId, dw.date, dw.description, dw.status, dw.createdAt, dw.labor, dw.materials, dw.attachments, dw.totalLaborCost, dw.totalMaterialCost, dw.grandTotal]
    );
  }

  console.log('Seeding complete');

  // --- Team ---
  const team = [
    { id: 'u1', companyId: 'c1', name: 'John Anderson', initials: 'JA', role: 'Project Manager', status: 'On Site', projectId: 'p1', projectName: 'City Centre Plaza', phone: '+1 555-0101', email: 'john@buildcorp.com', color: 'bg-blue-500', bio: 'Senior PM with 15 years experience.', location: 'Site Office', skills: '["Management", "Safety"]', certifications: '[]', performanceRating: 95, completedProjects: 12, joinDate: '2020-01-15', hourlyRate: 85.00 },
    { id: 'u2', companyId: 'c1', name: 'Sarah Mitchell', initials: 'SM', role: 'Site Supervisor', status: 'On Site', projectId: 'p1', projectName: 'City Centre Plaza', phone: '+1 555-0102', email: 'sarah@buildcorp.com', color: 'bg-green-500', bio: 'Expert in structural steel.', location: 'Sector 4', skills: '["Steel", "Logistics"]', certifications: '[]', performanceRating: 92, completedProjects: 8, joinDate: '2021-03-10', hourlyRate: 65.00 }
  ];
  for (const m of team) {
    await db.run(
      `INSERT INTO team (id, companyId, name, initials, role, status, projectId, projectName, phone, email, color, bio, location, skills, certifications, performanceRating, completedProjects, joinDate, hourlyRate)

       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.id, m.companyId, m.name, m.initials, m.role, m.status, m.projectId, m.projectName, m.phone, m.email, m.color, m.bio, m.location, m.skills, m.certifications, m.performanceRating, m.completedProjects, m.joinDate, m.hourlyRate]
    );
  }

  // --- Clients ---
  const clients = [
    { id: 'cl1', companyId: 'c1', name: 'Metro Developers', contactPerson: 'Alice Wright', role: 'Director', email: 'alice@metro.com', phone: '+1 555-0201', status: 'Active', tier: 'Platinum', activeProjects: 1, totalValue: '$25M' }
  ];
  for (const c of clients) {
    await db.run(
      `INSERT INTO clients (id, companyId, name, contactPerson, role, email, phone, status, tier, activeProjects, totalValue)

       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.companyId, c.name, c.contactPerson, c.role, c.email, c.phone, c.status, c.tier, c.activeProjects, c.totalValue]
    );
  }

  // --- Inventory ---
  const inventory = [
    { id: 'inv1', companyId: 'c1', name: 'Cement Bags', category: 'Materials', stock: 150, unit: 'bags', threshold: 50, status: 'In Stock', location: 'Warehouse A', lastOrderDate: '2025-10-01', costPerUnit: 12.50 }
  ];
  for (const i of inventory) {
    await db.run(
      `INSERT INTO inventory (id, companyId, name, category, stock, unit, threshold, status, location, lastOrderDate, costPerUnit)

       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [i.id, i.companyId, i.name, i.category, i.stock, i.unit, i.threshold, i.status, i.location, i.lastOrderDate, i.costPerUnit]
    );
  }

  // --- Safety Incidents ---
  const incidents = [
    { id: 'si1', title: 'Near miss with forklift', project: 'City Centre Plaza', projectId: 'p1', severity: 'Medium', status: 'Investigating', date: '2025-11-01', type: 'Machinery' }
  ];
  for (const s of incidents) {
    await db.run(
      `INSERT INTO safety_incidents (id, title, project, projectId, severity, status, date, type)

       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.title, s.project, s.projectId, s.severity, s.status, s.date, s.type]
    );
  }

  // --- Equipment ---
  const equipment = [
    { id: 'eq1', name: 'Excavator CAT-320', type: 'Heavy Machinery', status: 'In Use', projectId: 'p1', projectName: 'City Centre Plaza', lastService: '2025-09-15', nextService: '2025-12-15', companyId: 'c1', image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' }
  ];
  for (const e of equipment) {
    await db.run(
      `INSERT INTO equipment (id, name, type, status, projectId, projectName, lastService, nextService, companyId, image)

       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [e.id, e.name, e.type, e.status, e.projectId, e.projectName, e.lastService, e.nextService, e.companyId, e.image]
    );
  }

  // --- Timesheets ---
  const timesheets = [
    { id: 'ts1', employeeId: 'u1', employeeName: 'Mike Thompson', projectId: 'p1', projectName: 'City Centre Plaza', date: '2025-11-10', hours: 8, startTime: '07:00', endTime: '15:00', status: 'Approved', companyId: 'c1' }
  ];
  for (const t of timesheets) {
    await db.run(
      `INSERT INTO timesheets (id, employeeId, employeeName, projectId, projectName, date, hours, startTime, endTime, status, companyId)

       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.employeeId, t.employeeName, t.projectId, t.projectName, t.date, t.hours, t.startTime, t.endTime, t.status, t.companyId]
    );
  }
}
