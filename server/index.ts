import express from 'express';
import cors from 'cors';
import { initializeDatabase, getDb } from './database';
import { seedDatabase } from './seed';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

// --- Projects Routes ---
app.get('/api/projects', async (req, res) => {
  try {
    const db = getDb();
    const projects = await db.all('SELECT * FROM projects');
    const parsed = projects.map(p => ({
      ...p,
      weatherLocation: p.weatherLocation ? JSON.parse(p.weatherLocation) : null,
      zones: p.zones ? JSON.parse(p.zones) : [],
      phases: p.phases ? JSON.parse(p.phases) : [],
      // Mock tasks count for now, or do a JOIN query
      tasks: { total: 0, completed: 0, overdue: 0 }
    }));
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const db = getDb();
    const p = req.body;
    const id = p.id || uuidv4();
    const weatherLocation = p.weatherLocation ? JSON.stringify(p.weatherLocation) : null;
    const zones = p.zones ? JSON.stringify(p.zones) : '[]';
    const phases = p.phases ? JSON.stringify(p.phases) : '[]';

    await db.run(
      `INSERT INTO projects (id, companyId, name, code, description, location, type, status, health, progress, budget, spent, startDate, endDate, manager, image, teamSize, weatherLocation, aiAnalysis, zones, phases)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, p.companyId, p.name, p.code, p.description, p.location, p.type, p.status, p.health, p.progress, p.budget, p.spent, p.startDate, p.endDate, p.manager, p.image, p.teamSize, weatherLocation, p.aiAnalysis, zones, phases]
    );
    res.json({ ...p, id });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const updates = req.body;

    // Handle JSON fields
    if (updates.weatherLocation) updates.weatherLocation = JSON.stringify(updates.weatherLocation);
    if (updates.zones) updates.zones = JSON.stringify(updates.zones);
    if (updates.phases) updates.phases = JSON.stringify(updates.phases);

    // Remove id from updates if present
    delete updates.id;
    // Remove tasks if present (computed field)
    delete updates.tasks;

    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map(k => `${k} = ?`).join(',');

    await db.run(
      `UPDATE projects SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    res.json({ ...updates, id });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    await db.run('DELETE FROM projects WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// --- Tasks Routes ---
app.get('/api/tasks', async (req, res) => {
  try {
    const db = getDb();
    const tasks = await db.all('SELECT * FROM tasks');
    const parsed = tasks.map(t => ({
      ...t,
      dependencies: t.dependencies ? JSON.parse(t.dependencies) : []
    }));
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const db = getDb();
    const t = req.body;
    const id = t.id || uuidv4();
    const dependencies = t.dependencies ? JSON.stringify(t.dependencies) : '[]';

    await db.run(
      `INSERT INTO tasks (id, title, description, projectId, status, priority, assigneeName, assigneeType, dueDate, latitude, longitude, dependencies)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, t.title, t.description, t.projectId, t.status, t.priority, t.assigneeName, t.assigneeType, t.dueDate, t.latitude, t.longitude, dependencies]
    );
    res.json({ ...t, id });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const updates = req.body;

    if (updates.dependencies) updates.dependencies = JSON.stringify(updates.dependencies);

    delete updates.id;

    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map(k => `${k} = ?`).join(',');

    await db.run(
      `UPDATE tasks SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    res.json({ ...updates, id });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    await db.run('DELETE FROM tasks WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// --- Generic CRUD Helper ---
const createCrudRoutes = (tableName: string, jsonFields: string[] = []) => {
  app.get(`/api/${tableName}`, async (req, res) => {
    try {
      const db = getDb();
      const items = await db.all(`SELECT * FROM ${tableName}`);
      const parsed = items.map(item => {
        const newItem = { ...item };
        jsonFields.forEach(field => {
          if (newItem[field]) newItem[field] = JSON.parse(newItem[field]);
        });
        return newItem;
      });
      res.json(parsed);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post(`/api/${tableName}`, async (req, res) => {
    try {
      const db = getDb();
      const item = req.body;
      const id = item.id || uuidv4();

      // Prepare fields
      const keys = Object.keys(item).filter(k => k !== 'id');
      const values = keys.map(k => {
        if (jsonFields.includes(k)) return JSON.stringify(item[k]);
        return item[k];
      });

      const placeholders = keys.map(() => '?').join(',');
      const columns = keys.join(',');

      await db.run(
        `INSERT INTO ${tableName} (id, ${columns}) VALUES (?, ${placeholders})`,
        [id, ...values]
      );
      res.json({ ...item, id });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.put(`/api/${tableName}/:id`, async (req, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const updates = req.body;

      const keys = Object.keys(updates).filter(k => k !== 'id');
      const values = keys.map(k => {
        if (jsonFields.includes(k)) return JSON.stringify(updates[k]);
        return updates[k];
      });

      const setClause = keys.map(k => `${k} = ?`).join(',');

      await db.run(
        `UPDATE ${tableName} SET ${setClause} WHERE id = ?`,
        [...values, id]
      );
      res.json({ ...updates, id });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.delete(`/api/${tableName}/:id`, async (req, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      await db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });
};

// Register Routes for other entities
createCrudRoutes('team', ['skills', 'certifications']);
createCrudRoutes('documents', ['linkedTaskIds']);
createCrudRoutes('clients');
createCrudRoutes('inventory');
createCrudRoutes('rfis');
createCrudRoutes('punch_items');
createCrudRoutes('daily_logs');
createCrudRoutes('dayworks', ['labor', 'materials', 'attachments']);
createCrudRoutes('safety_incidents');
createCrudRoutes('equipment');
createCrudRoutes('timesheets');


// Initialize and Start
initializeDatabase().then(async () => {
  await seedDatabase();
  app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
});
