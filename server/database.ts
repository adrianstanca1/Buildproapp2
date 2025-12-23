import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Pool } = require('pg');
const dotenv = require('dotenv');
import { logger } from './utils/logger.js';

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
        logger.warn('Using SQLite for local development...');
        const sqlite3 = require('sqlite3');
        const { open } = require('sqlite');
        const db = await open({ filename: './buildpro_db.sqlite', driver: sqlite3.Database });
        await db.exec('PRAGMA foreign_keys = ON;');
        dbInstance = new SqliteAdapter(db);
      }
    }

    // Initialize schema
    await initializeSchema(dbInstance);
    return dbInstance;
  })();

  return initPromise;
}

export async function ensureDbInitialized(): Promise<IDatabase> {
  return initializeDatabase();
}

export function getDb(): IDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbInstance;
}

async function initializeSchema(db: IDatabase) {
  logger.info('Initializing database schema...');

  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      companyId TEXT,
      isActive BOOLEAN DEFAULT 1,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE SET NULL
    )
  `);

  // Companies table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo TEXT,
      address TEXT,
      subscriptionTier TEXT DEFAULT 'FREE',
      maxProjects INTEGER DEFAULT 5,
      maxUsers INTEGER DEFAULT 10,
      createdAt TEXT NOT NULL,
      isActive BOOLEAN DEFAULT 1
    )
  `);

  // Projects table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      code TEXT,
      name TEXT NOT NULL,
      description TEXT,
      location TEXT,
      type TEXT,
      status TEXT,
      health TEXT,
      progress REAL,
      budget REAL,
      spent REAL,
      startDate TEXT,
      endDate TEXT,
      manager TEXT,
      image TEXT,
      teamSize INTEGER,
      weatherLocation TEXT,
      aiAnalysis TEXT,
      zones TEXT,
      phases TEXT,
      timelineOptimizations TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Shared Links table (NEW for Client Portal)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS shared_links (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      companyId TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      password TEXT,
      expiresAt TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      lastAccessedAt TEXT,
      accessCount INTEGER DEFAULT 0,
      isActive BOOLEAN DEFAULT 1,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Tasks
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      companyId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      assignedTo TEXT,
      dueDate TEXT,
      startDate TEXT,
      duration INTEGER,
      dependencies TEXT,
      progress INTEGER DEFAULT 0,
      color TEXT,
      createdBy TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Tasks Schema Migration (Safe Add)
  await db.exec(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS startDate TEXT;`);
  await db.exec(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS duration INTEGER;`);
  await db.exec(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependencies TEXT;`);
  await db.exec(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;`);
  await db.exec(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS color TEXT;`);

  // Team
  await db.exec(`
    CREATE TABLE IF NOT EXISTS team (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL,
      phone TEXT,
      skills TEXT,
      certifications TEXT,
      status TEXT,
      projectId TEXT,
      availability TEXT,
      location TEXT,
      avatar TEXT,
      hourlyRate REAL,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Documents
  await db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      projectId TEXT NOT NULL,
      projectName TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      size TEXT,
      date TEXT,
      status TEXT,
      url TEXT,
      linkedTaskIds TEXT,
      currentVersion INTEGER,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Clients
  await db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      name TEXT NOT NULL,
      company TEXT,
      email TEXT,
      phone TEXT,
      projects TEXT,
      totalValue REAL,
      status TEXT,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Inventory
  await db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      quantity INTEGER,
      unit TEXT,
      location TEXT,
      reorderLevel INTEGER,
      status TEXT,
      supplier TEXT,
      unitCost REAL,
      totalValue REAL,
      lastRestocked TEXT,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Equipment
  await db.exec(`
    CREATE TABLE IF NOT EXISTS equipment (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT,
      model TEXT,
      serialNumber TEXT,
      status TEXT,
      location TEXT,
      assignedTo TEXT,
      purchaseDate TEXT,
      nextMaintenance TEXT,
      utilizationRate INTEGER,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // RFIs
  await db.exec(`
    CREATE TABLE IF NOT EXISTS rfis (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      projectId TEXT NOT NULL,
      number TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT,
      raisedBy TEXT,
      assignedTo TEXT,
      priority TEXT,
      status TEXT,
      dueDate TEXT,
      createdAt TEXT,
      response TEXT,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Punch Items
  await db.exec(`
    CREATE TABLE IF NOT EXISTS punch_items (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      projectId TEXT NOT NULL,
      location TEXT,
      description TEXT,
      priority TEXT,
      assignedTo TEXT,
      status TEXT,
      dueDate TEXT,
      createdAt TEXT,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Daily Logs
  await db.exec(`
    CREATE TABLE IF NOT EXISTS daily_logs (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      projectId TEXT NOT NULL,
      date TEXT,
      weather TEXT,
      temperature TEXT,
      workforce INTEGER,
      activities TEXT,
      equipment TEXT,
      delays TEXT,
      safetyIssues TEXT,
      notes TEXT,
      createdBy TEXT,
      status TEXT DEFAULT 'Draft',
      signedBy TEXT,
      signedAt TEXT,
      attachments TEXT,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (companyId) REFERENCES companies (id) ON DELETE CASCADE
    )
  `);

  // Daily Logs Schema Migration (Safe Add)
  await db.exec(`ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Draft';`);
  await db.exec(`ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS signedBy TEXT;`);
  await db.exec(`ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS signedAt TEXT;`);
  await db.exec(`ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS attachments TEXT;`);

  // Dayworks
  await db.exec(`
    CREATE TABLE IF NOT EXISTS dayworks (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      projectId TEXT NOT NULL,
      date TEXT,
      description TEXT,
      labor TEXT,
      materials TEXT,
      grandTotal REAL,
      status TEXT,
      attachments TEXT,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Safety Incidents
  await db.exec(`
    CREATE TABLE IF NOT EXISTS safety_incidents (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      projectId TEXT,
      type TEXT,
      title TEXT,
      severity TEXT,
      date TEXT,
      location TEXT,
      description TEXT,
      personInvolved TEXT,
      actionTaken TEXT,
      status TEXT,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Safety Hazards
  await db.exec(`
    CREATE TABLE IF NOT EXISTS safety_hazards (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      projectId TEXT,
      type TEXT,
      severity TEXT,
      riskScore REAL,
      description TEXT,
      recommendation TEXT,
      regulation TEXT,
      box_2d TEXT,
      timestamp TEXT,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Timesheets
  await db.exec(`
    CREATE TABLE IF NOT EXISTS timesheets (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      userId TEXT,
      userName TEXT,
      date TEXT,
      projectId TEXT,
      projectName TEXT,
      hoursWorked REAL,
      task TEXT,
      status TEXT,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Channels
  await db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      isPrivate BOOLEAN,
      memberIds TEXT,
      createdAt TEXT,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Team Messages
  await db.exec(`
    CREATE TABLE IF NOT EXISTS team_messages (
      id TEXT PRIMARY KEY,
      channelId TEXT NOT NULL,
      userId TEXT NOT NULL,
      userName TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      avatar TEXT,
      attachments TEXT,
      FOREIGN KEY (channelId) REFERENCES channels(id) ON DELETE CASCADE
    )
  `);

  // Transactions
  await db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      projectId TEXT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      category TEXT,
      date TEXT,
      status TEXT,
      costCodeId TEXT,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Purchase Orders
  await db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      projectId TEXT,
      poNumber TEXT UNIQUE NOT NULL,
      vendor TEXT NOT NULL,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL,
      requestedBy TEXT,
      approvers TEXT,
      dateCreated TEXT,
      dateRequired TEXT,
      notes TEXT,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Defects
  await db.exec(`
    CREATE TABLE IF NOT EXISTS defects (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      projectId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      severity TEXT,
      status TEXT,
      reportedBy TEXT,
      assignedTo TEXT,
      location TEXT,
      box_2d TEXT,
      createdAt TEXT,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Project Risks
  await db.exec(`
    CREATE TABLE IF NOT EXISTS project_risks (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      riskLevel TEXT,
      predictedDelayDays INTEGER,
      factors TEXT,
      recommendations TEXT,
      timestamp TEXT,
      trend TEXT,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Audit Logs
  await db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      userId TEXT NOT NULL,
      userName TEXT,
      action TEXT NOT NULL,
      resource TEXT,
      resourceId TEXT,
      changes TEXT,
      status TEXT,
      timestamp TEXT NOT NULL,
      ipAddress TEXT,
      userAgent TEXT
    )
  `);

  // System Settings (Global Config)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      updatedBy TEXT
    )
  `);

  // Vendors (Supply Chain)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      contact TEXT,
      email TEXT,
      phone TEXT,
      rating REAL,
      status TEXT,
      company_id TEXT,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Cost Codes (Financials)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS cost_codes (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      company_id TEXT,
      code TEXT,
      description TEXT,
      budget REAL,
      spent REAL DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Invoices
  await db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      projectId TEXT,
      number TEXT,
      vendorId TEXT,
      amount REAL,
      date TEXT,
      dueDate TEXT,
      status TEXT,
      costCodeId TEXT,
      items TEXT,
      files TEXT,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Expense Claims
  await db.exec(`
    CREATE TABLE IF NOT EXISTS expense_claims (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      projectId TEXT,
      userId TEXT,
      description TEXT,
      amount REAL,
      date TEXT,
      category TEXT,
      status TEXT,
      costCodeId TEXT,
      receiptUrl TEXT,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Notifications
  await db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      link TEXT,
      isRead BOOLEAN DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Comments table for collaboration
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT,
      parent_id TEXT,
      content TEXT NOT NULL,
      mentions TEXT,
      attachments TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Activity feed table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_feed (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      project_id TEXT,
      user_id TEXT NOT NULL,
      user_name TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      metadata TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Notification preferences table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      user_id TEXT PRIMARY KEY,
      email_mentions BOOLEAN DEFAULT 1,
      email_assignments BOOLEAN DEFAULT 1,
      email_comments BOOLEAN DEFAULT 1,
      email_digest_frequency TEXT DEFAULT 'daily',
      push_enabled BOOLEAN DEFAULT 0
    )
  `);

  // External Integrations table (Phase 13)
  db.exec(`
    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      accessToken TEXT,
      refreshToken TEXT,
      lastSyncedAt TEXT,
      settings TEXT,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Task assignments for resource allocation (Phase 9C)
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_assignments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT,
      role TEXT,
      allocated_hours REAL,
      actual_hours REAL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  // Initialize default maintenance mode (OFF) if not exists
  const maintenanceSetting = await db.get('SELECT key FROM system_settings WHERE key = ?', ['maintenance_mode']);
  if (!maintenanceSetting) {
    await db.run(
      `INSERT INTO system_settings (key, value, updatedAt, updatedBy) VALUES (?, ?, ?, ?)`,
      ['maintenance_mode', 'false', new Date().toISOString(), 'system']
    );
  }

  logger.info('Database schema initialized successfully');
}

export default {
  initializeDatabase,
  ensureDbInitialized,
  getDb
};
