import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Pool } = require('pg');
const dotenv = require('dotenv');
import logger from './logger.js';

dotenv.config();

// Interface for our DB adapter to support both SQLite and Postgres
export interface IDatabase {
  all<T = any>(sql: string, params?: any[]): Promise<T[]>;
  get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
  run(sql: string, params?: any[]): Promise<any>;
  exec(sql: string): Promise<void>;
}

let dbInstance: IDatabase;
let initPromise: Promise<IDatabase> | null = null;

class SqliteAdapter implements IDatabase {
  private db: any; // Type as any to avoid importing sqlite types at top level
  constructor(db: any) { this.db = db; }
  async all<T = any>(sql: string, params?: any[]) { return this.db.all(sql, params); }
  async get<T = any>(sql: string, params?: any[]) { return this.db.get(sql, params); }
  async run(sql: string, params?: any[]) { return this.db.run(sql, params); }
  async exec(sql: string) { return this.db.exec(sql); }
}

class PostgresAdapter implements IDatabase {
  private pool: any;
  constructor(connectionString: string) {
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    this.pool = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false, strict: false }
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

  async get<T = any>(sql: string, params?: any[]) {
    const res = await this.pool.query(this.normalizeSql(sql), params);
    return res.rows[0];
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
    // In production (Vercel), strictly require Postgres variables.
    // We do NOT want to fall back to ephemeral SQLite in production as it leads to data loss.
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

      if (connectionString) {
        logger.info('Initializing PostgreSQL connection for Production...');
        dbInstance = new PostgresAdapter(connectionString);
      } else {
        // Fallback to SQLite if no Postgres URL is provided (e.g. Cloud Run Demo)
        logger.warn('WARNING: DATABASE_URL missing in production. Falling back to SQLite (Ephemeral).');
        try {
          const sqlite3 = require('sqlite3');
          const { open } = require('sqlite');
          // Cloud Run filesystem is Read-Only. Must use /tmp for ephemeral DB.
          const dbPath = '/tmp/buildpro_db.sqlite';
          const db = await open({ filename: dbPath, driver: sqlite3.Database });
          await db.exec('PRAGMA foreign_keys = ON;');
          dbInstance = new SqliteAdapter(db);
        } catch (error) {
          logger.error('SQLite Fallback Failed:', error);
          throw new Error('Database initialization failed: No Postgres URL and SQLite failed.');
        }
      }
    } else {
      // Local development fallback
      const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
      if (connectionString) {
        logger.info('Initializing PostgreSQL connection...');
        dbInstance = new PostgresAdapter(connectionString);
      } else {
        logger.info('Initializing SQLite connection (Local/Dev)...');
        try {
          // Use require for sqlite3 to ensure compatibility
          const sqlite3 = require('sqlite3');
          const { open } = require('sqlite');

          const dbPath = './buildpro_db.sqlite';

          const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
          });
          await db.exec('PRAGMA foreign_keys = ON;');
          dbInstance = new SqliteAdapter(db);
        } catch (error) {
          logger.error('Failed to load SQLite:', error);
          throw new Error('SQLite initialization failed. Ensure sqlite3 is installed or use DATABASE_URL.');
        }
      }
    }

    await initSchema(dbInstance);
    logger.info('Database initialized');
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
      phases TEXT, -- JSON array
      timelineOptimizations TEXT -- JSON array
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      title TEXT,
      description TEXT,
      projectId TEXT,
      status TEXT,
      priority TEXT,
      assigneeId TEXT,
      assigneeName TEXT,
      assigneeType TEXT,
      dueDate TEXT,
      latitude REAL,
      longitude REAL,
      dependencies TEXT, -- JSON array string
      startDate TEXT,
      duration INTEGER,
      FOREIGN KEY(projectId) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT,
      plan TEXT,
      status TEXT,
      users INTEGER DEFAULT 0,
      projects INTEGER DEFAULT 0,
      mrr REAL DEFAULT 0,
      joinedDate TEXT,
      description TEXT,
      logo TEXT,
      website TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zipCode TEXT,
      country TEXT,
      settings TEXT, -- JSON string
      subscription TEXT, -- JSON string
      features TEXT, -- JSON array
      maxUsers INTEGER,
      maxProjects INTEGER,
      createdAt TEXT,
      updatedAt TEXT
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
      completedProjects INTEGER,
      joinDate TEXT,
      hourlyRate REAL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      projectId TEXT,
      companyId TEXT,
      projectName TEXT,
      size TEXT,
      date TEXT,
      status TEXT,
      url TEXT,
      linkedTaskIds TEXT, -- JSON array
      currentVersion INTEGER DEFAULT 1,
      versions TEXT, -- JSON array of history
      markupLayers TEXT -- JSON string for annotations
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
      companyId TEXT,
      number TEXT,
      subject TEXT,
      question TEXT,
      answer TEXT,
      assignedTo TEXT,
      status TEXT,
      dueDate TEXT,
      createdAt TEXT,
      planMetadata TEXT -- JSON string
    );

    CREATE TABLE IF NOT EXISTS punch_items (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      companyId TEXT,
      title TEXT,
      location TEXT,
      description TEXT,
      status TEXT,
      priority TEXT,
      assignedTo TEXT,
      createdAt TEXT,
      planMetadata TEXT -- JSON string
    );

    CREATE TABLE IF NOT EXISTS daily_logs (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      companyId TEXT,
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
      companyId TEXT,
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
      companyId TEXT,
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
      companyId TEXT,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS timesheets (
      id TEXT PRIMARY KEY,
      employeeId TEXT,
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

    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      name TEXT,
      type TEXT,
      unreadCount INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS team_messages (
      id TEXT PRIMARY KEY,
      channelId TEXT,
      senderId TEXT,
      senderName TEXT,
      senderRole TEXT,
      senderAvatar TEXT,
      content TEXT,
      createdAt TEXT,
      FOREIGN KEY(channelId) REFERENCES channels(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      projectId TEXT,
      date TEXT,
      description TEXT,
      amount REAL,
      type TEXT,
      category TEXT,
      status TEXT,
      invoice TEXT,
      costCodeId TEXT,
      isExported INTEGER DEFAULT 0,
      exportDate TEXT
    );

    CREATE TABLE IF NOT EXISTS cost_codes (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      companyId TEXT,
      code TEXT,
      description TEXT,
      budget REAL,
      spent REAL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      companyId TEXT,
      number TEXT,
      vendor TEXT,
      date TEXT,
      dueDate TEXT,
      amount REAL,
      tax REAL,
      total REAL,
      status TEXT,
      costCodeId TEXT,
      linkedPoId TEXT,
      lineItems TEXT, -- JSON array
      attachments TEXT -- JSON array
    );

    CREATE TABLE IF NOT EXISTS expense_claims (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      companyId TEXT,
      userId TEXT,
      userName TEXT,
      date TEXT,
      category TEXT,
      description TEXT,
      amount REAL,
      receiptUrl TEXT,
      status TEXT,
      costCodeId TEXT,
      approvedBy TEXT,
      approvedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      companyId TEXT,
      userId TEXT,
      userName TEXT,
      action TEXT,
      resource TEXT,
      resourceId TEXT,
      changes TEXT, -- JSON string
      status TEXT,
      timestamp TEXT,
      ipAddress TEXT,
      userAgent TEXT
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      permissions TEXT, -- JSON array
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      companyId TEXT NOT NULL,
      role TEXT NOT NULL,
      permissions TEXT, -- JSON array
      status TEXT DEFAULT 'active',
      joinedAt TEXT,
      invitedBy TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY (companyId) REFERENCES companies(id),
      UNIQUE(userId, companyId)
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      resource TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      roleId TEXT NOT NULL,
      permissionId TEXT NOT NULL,
      PRIMARY KEY (roleId, permissionId),
      FOREIGN KEY (permissionId) REFERENCES permissions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tenant_usage_logs (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      resourceType TEXT NOT NULL,
      amount INTEGER DEFAULT 1,
      timestamp TEXT NOT NULL,
      metadata TEXT,
      FOREIGN KEY (companyId) REFERENCES companies(id)
    );

    CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(userId);
    CREATE INDEX IF NOT EXISTS idx_memberships_company ON memberships(companyId);
    CREATE INDEX IF NOT EXISTS idx_usage_logs_company ON tenant_usage_logs(companyId);
    CREATE INDEX IF NOT EXISTS idx_usage_logs_type ON tenant_usage_logs(resourceType);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(companyId);
  `);

  // Migration: Add timelineOptimizations if not exists
  try {
    await db.exec('ALTER TABLE projects ADD COLUMN timelineOptimizations TEXT');
  } catch (e) {
    // Column likely exists
  }

  // Migration: Add image to equipment
  try {
    await db.exec('ALTER TABLE equipment ADD COLUMN image TEXT');
  } catch (e) {
    // Column likely exists
  }

  // Migration: Add joinDate and hourlyRate to team
  try {
    await db.exec('ALTER TABLE team ADD COLUMN joinDate TEXT');
  } catch (e) {
    // Column likely exists
  }
  try {
    await db.exec('ALTER TABLE team ADD COLUMN hourlyRate REAL');
  } catch (e) {
    // Column likely exists
  }

  // Migration: Add employeeId to timesheets
  try {
    await db.exec('ALTER TABLE timesheets ADD COLUMN employeeId TEXT');
  } catch (e) {
    // Column likely exists
  }

  // Migration: Add assigneeId to tasks
  try {
    await db.exec('ALTER TABLE tasks ADD COLUMN assigneeId TEXT');
  } catch (e) {
    // Column likely exists
  }

  // Migration: Add companyId to existing tables
  const tablesToUpdate = ['rfis', 'punch_items', 'daily_logs', 'dayworks', 'safety_incidents', 'tasks', 'documents'];
  for (const table of tablesToUpdate) {
    try {
      await db.exec(`ALTER TABLE ${table} ADD COLUMN companyId TEXT`);
    } catch (e) {
      // Column likely exists
    }
  }

  // Migration: Add Versioning to documents
  try { await db.exec('ALTER TABLE documents ADD COLUMN currentVersion INTEGER DEFAULT 1'); } catch (e) { }
  try { await db.exec('ALTER TABLE documents ADD COLUMN versions TEXT'); } catch (e) { }
  try { await db.exec('ALTER TABLE documents ADD COLUMN markupLayers TEXT'); } catch (e) { }

  // Migration: Add planMetadata to RFIs and Punch Items
  try { await db.exec('ALTER TABLE rfis ADD COLUMN planMetadata TEXT'); } catch (e) { }
  try { await db.exec('ALTER TABLE punch_items ADD COLUMN planMetadata TEXT'); } catch (e) { }

  // Migration: Add startDate and duration to tasks
  try { await db.exec('ALTER TABLE tasks ADD COLUMN startDate TEXT'); } catch (e) { }
  try { await db.exec('ALTER TABLE tasks ADD COLUMN duration INTEGER'); } catch (e) { }

  // Migration: Add costCodeId and export info to transactions
  try { await db.exec('ALTER TABLE transactions ADD COLUMN costCodeId TEXT'); } catch (e) { }
  try { await db.exec('ALTER TABLE transactions ADD COLUMN isExported INTEGER DEFAULT 0'); } catch (e) { }
  try { await db.exec('ALTER TABLE transactions ADD COLUMN exportDate TEXT'); } catch (e) { }
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const db = getDb();
    await db.all('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Graceful shutdown - close database connections
 */
export async function closeDatabaseConnections(): Promise<void> {
  const adapter = dbInstance;
  if (adapter && 'pool' in adapter) {
    await (adapter as any).pool.end();
    console.log('Database connections closed');
  }
}
