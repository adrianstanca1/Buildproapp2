import { getDb } from './database';
import { v4 as uuidv4 } from 'uuid';

export async function seedDatabase() {
  const db = getDb();

  const projectCount = await db.get('SELECT count(*) as count FROM projects');
  if (projectCount.count > 0) {
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
      `INSERT INTO projects (id, companyId, name, code, description, location, type, status, health, progress, budget, spent, startDate, endDate, manager, image, teamSize, weatherLocation, aiAnalysis)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.companyId, p.name, p.code, p.description, p.location, p.type, p.status, p.health, p.progress, p.budget, p.spent, p.startDate, p.endDate, p.manager, p.image, p.teamSize, p.weatherLocation, p.aiAnalysis]
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

  console.log('Seeding complete');
}
