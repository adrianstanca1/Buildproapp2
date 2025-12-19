/// <reference types="vite/client" />
import { Project, Task, TeamMember, ProjectDocument, Client, InventoryItem, RFI, PunchItem, DailyLog, Daywork, SafetyIncident, SafetyHazard, Equipment, Timesheet, Tenant, Transaction, TenantUsage, TenantAuditLog, TenantAnalytics, Defect, ProjectRisk, PurchaseOrder } from '@/types';
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
      console.error("Backend API unreachable. Application will degrade.");
      this.useMock = true; // Enabled for Vercel/Production resilience
    }
  }


  private async getHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
    const headers: Record<string, string> = { ...extra };
    if (this.tenantId) headers['x-company-id'] = this.tenantId;

    // Get real Auth Token
    const { data } = await import('./supabaseClient').then(m => m.supabase.auth.getSession());
    if (data.session?.access_token) {
      headers['Authorization'] = `Bearer ${data.session.access_token}`;
    }

    return headers;
  }

  // --- Generic Helpers ---
  private async fetch<T>(endpoint: string): Promise<T[]> {
    // Rigid Production Mode: Do not use mock unless explicitly configured (future feature)
    // if (this.useMock) return []; 

    try {
      const res = await fetch(`${API_URL}/${endpoint}`, {
        headers: await this.getHeaders()
      });
      if (!res.ok) throw new Error(`Failed to fetch ${endpoint} - ${res.statusText}`);
      return await res.json();
    } catch (e) {
      console.error(`API Error (${endpoint}):`, e);
      // Do not switch to mock. Bubble error up.
      throw e;
    }
  }

  private async post<T>(endpoint: string, data: T): Promise<T | null> {
    if (this.useMock) return null;
    try {
      const res = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: await this.getHeaders({ 'Content-Type': 'application/json' }),
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
        headers: await this.getHeaders({ 'Content-Type': 'application/json' }),
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
        headers: await this.getHeaders()
      });
      if (!res.ok) throw new Error(`Failed to delete ${endpoint}/${id}`);
    } catch (e) {
      console.error(`API Error (${endpoint}):`, e);
    }
  }

  // --- Projects ---
  async getProjects(): Promise<Project[]> {
    return this.fetch<Project>('projects');
  }
  async addProject(p: Project) {
    await this.post('projects', p);
  }
  async updateProject(id: string, p: Partial<Project>) {
    await this.put('projects', id, p);
  }
  async deleteProject(id: string) {
    await this.delete('projects', id);
  }

  // --- Tasks ---
  async getTasks(): Promise<Task[]> {
    return this.fetch<Task>('tasks');
  }
  async addTask(t: Task) {
    await this.post('tasks', t);
  }
  async updateTask(id: string, t: Partial<Task>) {
    await this.put('tasks', id, t);
  }

  // --- Team ---
  async getTeam(): Promise<TeamMember[]> {
    return this.fetch<TeamMember>('team');
  }
  async addTeamMember(m: TeamMember) {
    await this.post('team', m);
  }

  // --- Documents ---
  async getDocuments(): Promise<ProjectDocument[]> {
    return this.fetch<ProjectDocument>('documents');
  }
  async addDocument(d: ProjectDocument) {
    await this.post('documents', d);
  }
  async updateDocument(id: string, d: Partial<ProjectDocument>) {
    // await this.put('documents', id, d); // put implementation missing?
  }

  // --- Clients ---
  async getClients(): Promise<Client[]> {
    return this.fetch<Client>('clients');
  }
  async addClient(c: Client) {
    await this.post('clients', c);
  }

  // --- Inventory ---
  async getInventory(): Promise<InventoryItem[]> {
    return this.fetch<InventoryItem>('inventory');
  }
  async addInventoryItem(i: InventoryItem) {
    await this.post('inventory', i);
  }
  async updateInventoryItem(id: string, i: Partial<InventoryItem>) {
    await this.put('inventory', id, i);
  }

  // --- RFIs ---
  async getRFIs(): Promise<RFI[]> {
    return this.fetch<RFI>('rfis');
  }
  async addRFI(item: RFI) {
    await this.post('rfis', item);
  }

  // --- Punch Items ---
  async getPunchItems(): Promise<PunchItem[]> {
    return this.fetch<PunchItem>('punch_items');
  }
  async addPunchItem(item: PunchItem) {
    await this.post('punch_items', item);
  }

  // --- Daily Logs ---
  async getDailyLogs(): Promise<DailyLog[]> {
    return this.fetch<DailyLog>('daily_logs');
  }
  async addDailyLog(item: DailyLog) {
    await this.post('daily_logs', item);
  }

  // --- Dayworks ---
  async getDayworks(): Promise<Daywork[]> {
    return this.fetch<Daywork>('dayworks');
  }
  async addDaywork(item: Daywork) {
    await this.post('dayworks', item);
  }

  // --- Safety Incidents ---
  async getSafetyIncidents(): Promise<SafetyIncident[]> {
    return this.fetch<SafetyIncident>('safety_incidents');
  }
  async addSafetyIncident(item: SafetyIncident) {
    await this.post('safety_incidents', item);
  }
  async updateSafetyIncident(id: string, u: Partial<SafetyIncident>) {
    await this.put('safety_incidents', id, u);
  }

  // --- Safety Hazards ---
  async getSafetyHazards(): Promise<SafetyHazard[]> {
    return this.fetch<SafetyHazard>('safety_hazards');
  }
  async addSafetyHazard(item: SafetyHazard) {
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

  // --- Purchase Orders ---
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    if (this.useMock) return [];
    return this.fetch<PurchaseOrder>('purchase_orders');
  }
  async addPurchaseOrder(item: PurchaseOrder) {
    if (this.useMock) return;
    await this.post('purchase_orders', item);
  }
  async updatePurchaseOrder(id: string, u: Partial<PurchaseOrder>) {
    if (this.useMock) return;
    await this.put('purchase_orders', id, u);
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
    return this.fetch<Defect>('defects');
  }
  async addDefect(item: Defect) {
    await this.post('defects', item);
  }
  async updateDefect(id: string, u: Partial<Defect>) {
    await this.put('defects', id, u);
  }
  async deleteDefect(id: string) {
    await this.delete('defects', id);
  }

  // --- Project Health Forecasting ---
  async getProjectRisks(): Promise<ProjectRisk[]> {
    return this.fetch<ProjectRisk>('projectRisks');
  }

  async addProjectRisk(item: ProjectRisk) {
    await this.post('projectRisks', item);
  }


  // --- Companies ---
  async getCompanies(): Promise<Tenant[]> {
    return this.fetch<Tenant>('companies');
  }
  async addCompany(item: Tenant) {
    await this.post('companies', item);
  }
  async updateCompany(id: string, updates: Partial<Tenant>) {
    await this.put('companies', id, updates);
  }
  async deleteCompany(id: string) {
    await this.delete('companies', id);
  }

  // --- Tenant Analytics & Security ---
  async getTenantUsage(tenantId: string): Promise<TenantUsage> {
    const res = await fetch(`${API_URL}/tenants/${tenantId}/usage`, {
      headers: await this.getHeaders()
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
      headers: await this.getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch analytics");
    return await res.json();
  }

  async checkTenantLimits(tenantId: string, resourceType: string): Promise<any> {
    const res = await fetch(`${API_URL}/tenants/${tenantId}/limits/${resourceType}`, {
      headers: await this.getHeaders()
    });
    if (!res.ok) throw new Error("Failed to check limits");
    return await res.json();
  }

  async getRoles(): Promise<any[]> {
    return this.fetch('roles');
  }

  async getUserRoles(userId: string, companyId: string): Promise<any[]> {
    const res = await fetch(`${API_URL}/user-roles/${userId}/${companyId}`, {
      headers: await this.getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch user roles");
    return await res.json();
  }
}

export const db = new DatabaseService();
