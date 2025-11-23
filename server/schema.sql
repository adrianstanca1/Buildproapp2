-- Projects Table
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

-- Tasks Table
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

-- Team Table
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

-- Documents Table
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

-- Clients Table
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

-- Inventory Table
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

-- RFIs Table
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

-- Punch Items Table
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

-- Daily Logs Table
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

-- Dayworks Table
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

-- Safety Incidents Table
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

-- Equipment Table
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

-- Timesheets Table
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
