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
      `INSERT INTO projects (id, companyId, name, code, description, location, type, status, health, progress, budget, spent, startDate, endDate, manager, image, teamSize, weatherLocation, aiAnalysis, zones, phases)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.companyId, p.name, p.code, p.description, p.location, p.type, p.status, p.health, p.progress, p.budget, p.spent, p.startDate, p.endDate, p.manager, p.image, p.teamSize, p.weatherLocation, p.aiAnalysis, '[]', '[]']
    );
  }

  const tasks = [
    { id: 't1', title: 'Safety inspection - Site A', description: 'Conduct full perimeter safety check.', projectId: 'p1', status: 'To Do', priority: 'High', assigneeName: 'Mike Thompson', assigneeType: 'user', dueDate: '2025-11-12', latitude: 40.7128, longitude: -74.0060, dependencies: '[]' },
    { id: 't2', title: 'Concrete pouring - Level 2', description: 'Pour and finish slab for level 2 podium.', projectId: 'p1', status: 'Blocked', priority: 'Critical', assigneeName: 'All Operatives', assigneeType: 'role', dueDate: '2025-11-20', latitude: 40.7135, longitude: -74.0055, dependencies: '["t1"]' }
  ];

  for (const t of tasks) {
    await db.run(
      `INSERT INTO tasks (id, title, description, projectId, status, priority, assigneeName, assigneeType, dueDate, latitude, longitude, dependencies)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.title, t.description, t.projectId, t.status, t.priority, t.assigneeName, t.assigneeType, t.dueDate, t.latitude, t.longitude, t.dependencies]
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
}
