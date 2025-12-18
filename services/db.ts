/// <reference types="vite/client" />
import { Project, Task, TeamMember, ProjectDocument, Client, InventoryItem, RFI, PunchItem, DailyLog, Daywork, SafetyIncident, SafetyHazard, Equipment, Timesheet, Tenant, Transaction, TenantUsage, TenantAuditLog, TenantAnalytics, Defect, ProjectRisk } from '@/types';
import { db as mockDb } from './mockDb';

const API_URL = import.meta.env.VITE_API_URL || '/api';

class DatabaseService {
  private useMock = false;
  private tenantId: string | null = null;

  constructor() {
    // Simple health check on init
    this.checkHealth();
  }

  setTenantId(id: string | null) {
    this.tenantId = id;
  }

  private async checkHealth() {
    try {
      const res = await fetch(`${API_URL}/projects`, { method: 'HEAD' }); // Lightweight check
      if (!res.ok) throw new Error("API Unreachable");
      console.log("Connected to Backend API");
    } catch (e) {
      console.warn("Backend API unreachable, switching to Mock/Local Mode. ⚠️ DATA WILL NOT BE SAVED PERMANENTLY ⚠️");
      this.useMock = true;
    }
  }

  private getHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = { ...extra };
    if (this.tenantId) headers['x-company-id'] = this.tenantId;
    // Mock user context for now - in real app would come from AuthContext
    headers['x-user-id'] = 'user-admin-001';
    headers['x-user-name'] = 'John Anderson';
    return headers;
  }

  // --- Generic Helpers ---
  private async fetch<T>(endpoint: string): Promise<T[]> {
    if (this.useMock) return []; // Or delegate to mockDb generic if implemented
    try {
      const res = await fetch(`${API_URL}/${endpoint}`, {
        headers: this.getHeaders()
      });
      if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
      return await res.json();
    } catch (e) {
      console.error(`API Error (${endpoint}):`, e);
      this.useMock = true; // Auto-switch on failure
      return [];
    }
  }

  private async post<T>(endpoint: string, data: T): Promise<T | null> {
    if (this.useMock) return null;
    try {
      const res = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`Failed to post to ${endpoint}`);
      return await res.json();
    } catch (e) {
      console.error(`API Error (${endpoint}):`, e);
      return null;
    }
  }

  private async put<T>(endpoint: string, id: string, data: Partial<T>): Promise<void> {
    if (this.useMock) return;
    try {
      const res = await fetch(`${API_URL}/${endpoint}/${id}`, {
        method: 'PUT',
        headers: this.getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`Failed to update ${endpoint}/${id}`);
    } catch (e) {
      console.error(`API Error (${endpoint}):`, e);
    }
  }

  private async delete(endpoint: string, id: string): Promise<void> {
    if (this.useMock) return;
    try {
      const res = await fetch(`${API_URL}/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      if (!res.ok) throw new Error(`Failed to delete ${endpoint}/${id}`);
    } catch (e) {
      console.error(`API Error (${endpoint}):`, e);
    }
  }

  // --- Projects ---
  async getProjects(): Promise<Project[]> {
    if (this.useMock) return mockDb.getProjects();
    return this.fetch<Project>('projects').catch(() => mockDb.getProjects());
  }
  async addProject(p: Project) {
    if (this.useMock) return mockDb.addProject(p);
    await this.post('projects', p);
  }
  async updateProject(id: string, p: Partial<Project>) {
    if (this.useMock) return mockDb.updateProject(id, p);
    await this.put('projects', id, p);
  }
  async deleteProject(id: string) {
    if (this.useMock) return mockDb.deleteProject(id);
    await this.delete('projects', id);
  }

  // --- Tasks ---
  async getTasks(): Promise<Task[]> {
    if (this.useMock) return mockDb.getTasks();
    return this.fetch<Task>('tasks').catch(() => mockDb.getTasks());
  }
  async addTask(t: Task) {
    if (this.useMock) return mockDb.addTask(t);
    await this.post('tasks', t);
  }
  async updateTask(id: string, t: Partial<Task>) {
    if (this.useMock) return mockDb.updateTask(id, t);
    await this.put('tasks', id, t);
  }

  // --- Team ---
  async getTeam(): Promise<TeamMember[]> {
    if (this.useMock) return mockDb.getTeam();
    return this.fetch<TeamMember>('team').catch(() => mockDb.getTeam());
  }
  async addTeamMember(m: TeamMember) {
    if (this.useMock) return mockDb.addTeamMember(m);
    await this.post('team', m);
  }

  // --- Documents ---
  async getDocuments(): Promise<ProjectDocument[]> {
    if (this.useMock) return mockDb.getDocuments();
    return this.fetch<ProjectDocument>('documents').catch(() => mockDb.getDocuments());
  }
  async addDocument(d: ProjectDocument) {
    if (this.useMock) return mockDb.addDocument(d);
    await this.post('documents', d);
  }
  async updateDocument(id: string, d: Partial<ProjectDocument>) {
    if (this.useMock) return mockDb.updateDocument(id, d);
  }

  // --- Clients ---
  async getClients(): Promise<Client[]> {
    if (this.useMock) return mockDb.getClients();
    return this.fetch<Client>('clients').catch(() => mockDb.getClients());
  }
  async addClient(c: Client) {
    if (this.useMock) return mockDb.addClient(c);
    await this.post('clients', c);
  }

  // --- Inventory ---
  async getInventory(): Promise<InventoryItem[]> {
    if (this.useMock) return mockDb.getInventory();
    return this.fetch<InventoryItem>('inventory').catch(() => mockDb.getInventory());
  }
  async addInventoryItem(i: InventoryItem) {
    if (this.useMock) return mockDb.addInventoryItem(i);
    await this.post('inventory', i);
  }
  async updateInventoryItem(id: string, i: Partial<InventoryItem>) {
    if (this.useMock) return mockDb.updateInventoryItem(id, i);
    await this.put('inventory', id, i);
  }

  // --- RFIs ---
  async getRFIs(): Promise<RFI[]> {
    if (this.useMock) return mockDb.getRFIs();
    return this.fetch<RFI>('rfis').catch(() => mockDb.getRFIs());
  }
  async addRFI(item: RFI) {
    if (this.useMock) return mockDb.addRFI(item);
    await this.post('rfis', item);
  }

  // --- Punch Items ---
  async getPunchItems(): Promise<PunchItem[]> {
    if (this.useMock) return mockDb.getPunchItems();
    return this.fetch<PunchItem>('punch_items').catch(() => mockDb.getPunchItems());
  }
  async addPunchItem(item: PunchItem) {
    if (this.useMock) return mockDb.addPunchItem(item);
    await this.post('punch_items', item);
  }

  // --- Daily Logs ---
  async getDailyLogs(): Promise<DailyLog[]> {
    if (this.useMock) return mockDb.getDailyLogs();
    return this.fetch<DailyLog>('daily_logs').catch(() => mockDb.getDailyLogs());
  }
  async addDailyLog(item: DailyLog) {
    if (this.useMock) return mockDb.addDailyLog(item);
    await this.post('daily_logs', item);
  }

  // --- Dayworks ---
  async getDayworks(): Promise<Daywork[]> {
    if (this.useMock) return mockDb.getDayworks();
    return this.fetch<Daywork>('dayworks').catch(() => mockDb.getDayworks());
  }
  async addDaywork(item: Daywork) {
    if (this.useMock) return mockDb.addDaywork(item);
    await this.post('dayworks', item);
  }

  // --- Safety Incidents ---
  async getSafetyIncidents(): Promise<SafetyIncident[]> {
    if (this.useMock) return []; // Mock DB missing this, return empty
    return this.fetch<SafetyIncident>('safety_incidents');
  }
  async addSafetyIncident(item: SafetyIncident) {
    if (this.useMock) return;
    await this.post('safety_incidents', item);
  }
  async updateSafetyIncident(id: string, u: Partial<SafetyIncident>) {
    if (this.useMock) return;
    await this.put('safety_incidents', id, u);
  }

  // --- Safety Hazards ---
  async getSafetyHazards(): Promise<SafetyHazard[]> {
    if (this.useMock) return JSON.parse(localStorage.getItem('safety_hazards') || '[]');
    return this.fetch<SafetyHazard>('safety_hazards').catch(() => JSON.parse(localStorage.getItem('safety_hazards') || '[]'));
  }
  async addSafetyHazard(item: SafetyHazard) {
    if (this.useMock) {
      const hazards = await this.getSafetyHazards();
      localStorage.setItem('safety_hazards', JSON.stringify([item, ...hazards]));
      return;
    }
    await this.post('safety_hazards', item);
  }

  // --- Equipment ---
  async getEquipment(): Promise<Equipment[]> {
    if (this.useMock) return [];
    return this.fetch<Equipment>('equipment');
  }
  async addEquipment(item: Equipment) {
    if (this.useMock) return;
    await this.post('equipment', item);
  }
  async updateEquipment(id: string, u: Partial<Equipment>) {
    if (this.useMock) return;
    await this.put('equipment', id, u);
  }

  // --- Timesheets ---
  async getTimesheets(): Promise<Timesheet[]> {
    if (this.useMock) return [];
    return this.fetch<Timesheet>('timesheets');
  }
  async addTimesheet(item: Timesheet) {
    if (this.useMock) return;
    await this.post('timesheets', item);
  }
  async updateTimesheet(id: string, u: Partial<Timesheet>) {
    if (this.useMock) return;
    await this.put('timesheets', id, u);
  }

  // --- Transactions ---
  async getTransactions(): Promise<Transaction[]> {
    if (this.useMock) return [];
    return this.fetch<Transaction>('transactions');
  }
  async addTransaction(item: Transaction) {
    if (this.useMock) return;
    await this.post('transactions', item);
  }

  // --- Channels ---
  async getChannels(): Promise<any[]> {
    if (this.useMock) return [];
    return this.fetch('channels');
  }
  async addChannel(item: any) {
    if (this.useMock) return;
    await this.post('channels', item);
  }

  // --- Team Messages ---
  async getTeamMessages(): Promise<any[]> {
    if (this.useMock) return [];
    return this.fetch('team_messages');
  }
  async addTeamMessage(item: any) {
    if (this.useMock) return;
    await this.post('team_messages', item);
  }

  // --- Defects ---
  async getDefects(): Promise<Defect[]> {
    if (this.useMock) return JSON.parse(localStorage.getItem('defects') || '[]');
    return this.fetch<Defect>('defects').catch(() => JSON.parse(localStorage.getItem('defects') || '[]'));
  }
  async addDefect(item: Defect) {
    if (this.useMock) {
      const defects = await this.getDefects();
      localStorage.setItem('defects', JSON.stringify([item, ...defects]));
      return;
    }
    await this.post('defects', item);
  }
  async updateDefect(id: string, u: Partial<Defect>) {
    if (this.useMock) {
      const defects = await this.getDefects();
      localStorage.setItem('defects', JSON.stringify(defects.map(d => d.id === id ? { ...d, ...u } : d)));
      return;
    }
    await this.put('defects', id, u);
  }
  async deleteDefect(id: string) {
    if (this.useMock) {
      const defects = await this.getDefects();
      localStorage.setItem('defects', JSON.stringify(defects.filter(d => d.id !== id)));
      return;
    }
    await this.delete('defects', id);
  }

  // --- Project Health Forecasting ---
  async getProjectRisks(): Promise<ProjectRisk[]> {
    if (this.useMock) return JSON.parse(localStorage.getItem('projectRisks') || '[]');
    return this.fetch<ProjectRisk>('projectRisks').catch(() => JSON.parse(localStorage.getItem('projectRisks') || '[]'));
  }

  async addProjectRisk(item: ProjectRisk) {
    if (this.useMock) {
      const risks = await this.getProjectRisks();
      localStorage.setItem('projectRisks', JSON.stringify([item, ...risks]));
      return;
    }
    await this.post('projectRisks', item);
  }


  // --- Companies ---
  async getCompanies(): Promise<Tenant[]> {
    if (this.useMock) return mockDb.getCompanies();
    return this.fetch<Tenant>('companies').catch(() => mockDb.getCompanies());
  }
  async addCompany(item: Tenant) {
    if (this.useMock) return mockDb.addCompany(item);
    await this.post('companies', item);
  }
  async updateCompany(id: string, updates: Partial<Tenant>) {
    if (this.useMock) return mockDb.updateCompany(id, updates);
    await this.put('companies', id, updates);
  }
  async deleteCompany(id: string) {
    if (this.useMock) return mockDb.deleteCompany(id);
    await this.delete('companies', id);
  }

  // --- Tenant Analytics & Security ---
  async getTenantUsage(tenantId: string): Promise<TenantUsage> {
    const res = await fetch(`${API_URL}/tenants/${tenantId}/usage`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch usage");
    return await res.json();
  }

  async getAuditLogs(tenantId: string): Promise<TenantAuditLog[]> {
    return this.fetch<TenantAuditLog>(`audit_logs?tenantId=${tenantId}`);
  }

  // --- Multi-Tenant Intelligence & Roles ---
  async getTenantAnalytics(tenantId: string): Promise<TenantAnalytics> {
    const res = await fetch(`${API_URL}/tenants/${tenantId}/analytics`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch analytics");
    return await res.json();
  }

  async checkTenantLimits(tenantId: string, resourceType: string): Promise<any> {
    const res = await fetch(`${API_URL}/tenants/${tenantId}/limits/${resourceType}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error("Failed to check limits");
    return await res.json();
  }

  async getRoles(): Promise<any[]> {
    return this.fetch('roles');
  }

  async getUserRoles(userId: string, companyId: string): Promise<any[]> {
    const res = await fetch(`${API_URL}/user-roles/${userId}/${companyId}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch user roles");
    return await res.json();
  }
}

export const db = new DatabaseService();
