
/// <reference types="vite/client" />
import { Project, Task, TeamMember, ProjectDocument, Client, InventoryItem, RFI, PunchItem, DailyLog, Daywork, SafetyIncident, Equipment, Timesheet } from '../types';
import { db as mockDb } from './mockDb';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

class DatabaseService {
  private useMock = false;

  constructor() {
    // Simple health check on init
    this.checkHealth();
  }

  private async checkHealth() {
    try {
      const res = await fetch(`${API_URL}/projects`, { method: 'HEAD' }); // Lightweight check
      if (!res.ok) throw new Error("API Unreachable");
      console.log("Connected to Backend API");
    } catch (e) {
      console.warn("Backend API unreachable, switching to Mock/Local Mode.");
      this.useMock = true;
    }
  }

  // --- Generic Helpers ---
  private async fetch<T>(endpoint: string): Promise<T[]> {
    if (this.useMock) return []; // Or delegate to mockDb generic if implemented
    try {
      const res = await fetch(`${API_URL}/${endpoint}`);
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        method: 'DELETE'
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
}
