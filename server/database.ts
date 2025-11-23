import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Interface for our DB adapter to support both SQLite and Postgres
export interface IDatabase {
  all<T = any>(sql: string, params?: any[]): Promise<T[]>;
  run(sql: string, params?: any[]): Promise<any>;
  exec(sql: string): Promise<void>;
}

let dbInstance: IDatabase;
let initPromise: Promise<IDatabase> | null = null;

class SqliteAdapter implements IDatabase {
  private db: any; // Type as any to avoid importing sqlite types at top level
  constructor(db: any) { this.db = db; }
  async all<T = any>(sql: string, params?: any[]) { return this.db.all(sql, params); }
  async run(sql: string, params?: any[]) { return this.db.run(sql, params); }
  async exec(sql: string) { return this.db.exec(sql); }
}

class PostgresAdapter implements IDatabase {
  private pool: pg.Pool;
  constructor(connectionString: string) {
    this.pool = new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false } // Required for Neon/Supabase
    });
  }

  // Convert ? to $1, $2, etc. for Postgres compatibility
  private normalizeSql(sql: string): string {
    let i = 1;
    return sql.replace(/\?/g, () => `$${i++}`);
  }

  async all<T = any>(sql: string, params?: any[]) {
    const res = await this.pool.query(this.normalizeSql(sql), params);
    return res.rows;
  }

  async run(sql: string, params?: any[]) {
    const res = await this.pool.query(this.normalizeSql(sql), params);
    return { changes: res.rowCount };
  }

  async exec(sql: string) {
    await this.pool.query(sql);
  }
}

export async function initializeDatabase() {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (connectionString) {
      console.log('Initializing PostgreSQL connection...');
      dbInstance = new PostgresAdapter(connectionString);
    } else {
      console.log('Initializing SQLite connection...');
      try {
        // Dynamic import to avoid loading sqlite3 in serverless environments (Vercel)
        // @ts-ignore
        const sqlite3 = (await import('sqlite3')).default;
        // @ts-ignore
        const { open } = await import('sqlite');

        // Use /tmp on Vercel (ephemeral) or local file otherwise
        const dbPath = process.env.VERCEL ? '/tmp/buildpro_db.sqlite' : './buildpro_db.sqlite';

        const db = await open({
          filename: dbPath,
          driver: sqlite3.Database
        });
        await db.exec('PRAGMA foreign_keys = ON;');
        dbInstance = new SqliteAdapter(db);
      } catch (error) {
        console.error('Failed to load SQLite:', error);
        throw new Error('SQLite initialization failed. Ensure sqlite3 is installed or use DATABASE_URL.');
      }
    }

    await initSchema(dbInstance);
    console.log('Database initialized');
    return dbInstance;
  })();

  return initPromise;
}

export async function ensureDbInitialized() {
  if (!dbInstance) {
    await initializeDatabase();
  }
  return dbInstance;
}

export function getDb() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call ensureDbInitialized() first.');
  }
  return dbInstance;
}

async function initSchema(db: IDatabase) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      name TEXT,
      code TEXT,
      description TEXT,
      location TEXT,
      type TEXT,
      status TEXT,
      health TEXT,
      progress INTEGER,
      budget REAL,
      spent REAL,
      startDate TEXT,
      endDate TEXT,
      manager TEXT,
      image TEXT,
      teamSize INTEGER,
      weatherLocation TEXT, -- JSON string
      aiAnalysis TEXT,
      zones TEXT, -- JSON array
      phases TEXT -- JSON array
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      projectId TEXT,
      status TEXT,
      priority TEXT,
      assigneeName TEXT,
      assigneeType TEXT,
      dueDate TEXT,
      latitude REAL,
      longitude REAL,
      dependencies TEXT, -- JSON array string
      FOREIGN KEY(projectId) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS team (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      name TEXT,
      initials TEXT,
      role TEXT,
      status TEXT,
      projectId TEXT,
      projectName TEXT,
      phone TEXT,
      color TEXT,
      email TEXT,
      bio TEXT,
      location TEXT,
      skills TEXT, -- JSON array
      certifications TEXT, -- JSON array
      performanceRating INTEGER,
      completedProjects INTEGER
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      projectId TEXT,
      projectName TEXT,
      size TEXT,
      date TEXT,
      status TEXT,
      url TEXT,
      linkedTaskIds TEXT -- JSON array
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      name TEXT,
      contactPerson TEXT,
      role TEXT,
      email TEXT,
      phone TEXT,
      status TEXT,
      tier TEXT,
      activeProjects INTEGER,
      totalValue TEXT
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      name TEXT,
      category TEXT,
      stock INTEGER,
      unit TEXT,
      threshold INTEGER,
      status TEXT,
      location TEXT,
      lastOrderDate TEXT,
      costPerUnit REAL
    );

    CREATE TABLE IF NOT EXISTS rfis (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      number TEXT,
      subject TEXT,
      question TEXT,
      answer TEXT,
      assignedTo TEXT,
      status TEXT,
      dueDate TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS punch_items (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      title TEXT,
      location TEXT,
      description TEXT,
      status TEXT,
      priority TEXT,
      assignedTo TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_logs (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      date TEXT,
      weather TEXT,
      notes TEXT,
      workPerformed TEXT,
      crewCount INTEGER,
      author TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS dayworks (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      date TEXT,
      description TEXT,
      status TEXT,
      createdAt TEXT,
      labor TEXT, -- JSON array
      materials TEXT, -- JSON array
      attachments TEXT, -- JSON array
      totalLaborCost REAL,
      totalMaterialCost REAL,
      grandTotal REAL
    );

    CREATE TABLE IF NOT EXISTS safety_incidents (
      id TEXT PRIMARY KEY,
      title TEXT,
      project TEXT,
      projectId TEXT,
      severity TEXT,
      status TEXT,
      date TEXT,
      type TEXT
    );

    CREATE TABLE IF NOT EXISTS equipment (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      status TEXT,
      projectId TEXT,
      projectName TEXT,
      lastService TEXT,
      nextService TEXT,
      companyId TEXT
    );

    CREATE TABLE IF NOT EXISTS timesheets (
      id TEXT PRIMARY KEY,
      employeeName TEXT,
      projectId TEXT,
      projectName TEXT,
      date TEXT,
      hours REAL,
      startTime TEXT,
      endTime TEXT,
      status TEXT,
      companyId TEXT
    );
  `);
}
