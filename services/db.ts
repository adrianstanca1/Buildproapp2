
import { Project, Task, TeamMember, ProjectDocument, Client, InventoryItem, RFI, PunchItem, DailyLog, Daywork, SafetyIncident, Equipment, Timesheet } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

class DatabaseService {

  // --- Generic Helpers ---
  private async fetch<T>(endpoint: string): Promise<T[]> {
    try {
      const res = await fetch(`${API_URL}/${endpoint}`);
      if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
      return await res.json();
    } catch (e) {
      console.error(`API Error (${endpoint}):`, e);
      return [];
    }
  }

  private async post<T>(endpoint: string, data: T): Promise<T | null> {
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
  async getProjects(): Promise<Project[]> { return this.fetch<Project>('projects'); }
  async addProject(p: Project) { await this.post('projects', p); }
  async updateProject(id: string, p: Partial<Project>) { await this.put('projects', id, p); }
  async deleteProject(id: string) { await this.delete('projects', id); }

  // --- Tasks ---
  async getTasks(): Promise<Task[]> { return this.fetch<Task>('tasks'); }
  async addTask(t: Task) { await this.post('tasks', t); }
  async updateTask(id: string, t: Partial<Task>) { await this.put('tasks', id, t); }

  // --- Team ---
  async getTeam(): Promise<TeamMember[]> { return this.fetch<TeamMember>('team'); }
  async addTeamMember(m: TeamMember) { await this.post('team', m); }

  // --- Documents ---
  async getDocuments(): Promise<ProjectDocument[]> { return this.fetch<ProjectDocument>('documents'); }
  async addDocument(d: ProjectDocument) { await this.post('documents', d); }
  async updateDocument(id: string, d: Partial<ProjectDocument>) { await this.put('documents', id, d); }

  // --- Clients ---
  async getClients(): Promise<Client[]> { return this.fetch<Client>('clients'); }
  async addClient(c: Client) { await this.post('clients', c); }

  // --- Inventory ---
  async getInventory(): Promise<InventoryItem[]> { return this.fetch<InventoryItem>('inventory'); }
  async addInventoryItem(i: InventoryItem) { await this.post('inventory', i); }
  async updateInventoryItem(id: string, i: Partial<InventoryItem>) { await this.put('inventory', id, i); }

  // --- RFIs ---
  async getRFIs(): Promise<RFI[]> { return this.fetch<RFI>('rfis'); }
  async addRFI(item: RFI) { await this.post('rfis', item); }

  // --- Punch Items ---
  async getPunchItems(): Promise<PunchItem[]> { return this.fetch<PunchItem>('punch_items'); }
  async addPunchItem(item: PunchItem) { await this.post('punch_items', item); }

  // --- Daily Logs ---
  async getDailyLogs(): Promise<DailyLog[]> { return this.fetch<DailyLog>('daily_logs'); }
  async addDailyLog(item: DailyLog) { await this.post('daily_logs', item); }

  // --- Dayworks ---
  async getDayworks(): Promise<Daywork[]> { return this.fetch<Daywork>('dayworks'); }
  async addDaywork(item: Daywork) { await this.post('dayworks', item); }

  // --- Safety Incidents ---
  async getSafetyIncidents(): Promise<SafetyIncident[]> { return this.fetch<SafetyIncident>('safety_incidents'); }
  async addSafetyIncident(item: SafetyIncident) { await this.post('safety_incidents', item); }
  async updateSafetyIncident(id: string, u: Partial<SafetyIncident>) { await this.put('safety_incidents', id, u); }

  // --- Equipment ---
  async getEquipment(): Promise<Equipment[]> { return this.fetch<Equipment>('equipment'); }
  async addEquipment(item: Equipment) { await this.post('equipment', item); }
  async updateEquipment(id: string, u: Partial<Equipment>) { await this.put('equipment', id, u); }

  // --- Timesheets ---
  async getTimesheets(): Promise<Timesheet[]> { return this.fetch<Timesheet>('timesheets'); }
  async addTimesheet(item: Timesheet) { await this.post('timesheets', item); }
  async updateTimesheet(id: string, u: Partial<Timesheet>) { await this.put('timesheets', id, u); }
}

export const db = new DatabaseService();
