import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Tenant, TenantAuditLog, TenantMember, TenantUsage, TenantSettings } from '@/types';

interface TenantContextType {
  // Current tenant
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;

  // Tenant list
  tenants: Tenant[];
  setTenants: (tenants: Tenant[]) => void;

  // Tenant management
  addTenant: (tenant: Tenant) => Promise<void>;
  updateTenant: (id: string, updates: Partial<Tenant>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  getTenantById: (id: string) => Tenant | undefined;

  // Tenant settings
  updateTenantSettings: (tenantId: string, settings: Partial<TenantSettings>) => Promise<void>;
  getTenantSettings: (tenantId: string) => TenantSettings | null;

  // Tenant members
  tenantMembers: TenantMember[];
  addTenantMember: (member: TenantMember) => Promise<void>;
  removeTenantMember: (tenantId: string, memberId: string) => Promise<void>;
  updateTenantMemberRole: (tenantId: string, memberId: string, role: TenantMember['role']) => Promise<void>;

  // Audit logs
  auditLogs: TenantAuditLog[];
  addAuditLog: (log: TenantAuditLog) => Promise<void>;
  getTenantAuditLogs: (tenantId: string) => TenantAuditLog[];

  // Usage tracking
  tenantUsage: TenantUsage | null;
  updateTenantUsage: (usage: TenantUsage) => Promise<void>;
  getTenantUsagePercentage: (tenantId: string, metric: 'users' | 'projects' | 'storage') => number;

  // Status
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantMembers, setTenantMembers] = useState<TenantMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<TenantAuditLog[]>([]);
  const [tenantUsage, setTenantUsage] = useState<TenantUsage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with mock data
  useEffect(() => {
    const mockTenants: Tenant[] = [
      {
        id: 't1',
        companyId: 'c1',
        name: 'BuildPro Construction',
        description: 'Main construction management tenant',
        logo: 'https://via.placeholder.com/100',
        website: 'https://buildpro.com',
        email: 'admin@buildpro.com',
        phone: '+1 (555) 123-4567',
        address: '123 Construction Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        plan: 'Enterprise',
        status: 'Active',
        settings: {
          timezone: 'America/New_York',
          language: 'en',
          dateFormat: 'MM/DD/YYYY',
          currency: 'USD',
          emailNotifications: true,
          dataRetention: 2555, // 7 years
          twoFactorAuth: true,
          sso: true,
          customBranding: true,
        },
        subscription: {
          id: 'sub-1',
          planId: 'enterprise',
          status: 'active',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          billingEmail: 'billing@buildpro.com',
          billingAddress: '123 Construction Ave, New York, NY 10001',
          paymentMethod: 'Visa ending in 4242',
        },
        createdAt: '2024-01-15',
        updatedAt: '2024-12-02',
        maxUsers: 100,
        maxProjects: 50,
        features: [
          { id: 'f1', name: 'Multi-project Management', enabled: true },
          { id: 'f2', name: 'Team Collaboration', enabled: true },
          { id: 'f3', name: 'AI Insights', enabled: true },
          { id: 'f4', name: 'Advanced Reporting', enabled: true },
          { id: 'f5', name: 'Custom Integrations', enabled: true },
        ],
      },
      {
        id: 't2',
        companyId: 'c2',
        name: 'City Construction Inc',
        description: 'Regional construction company',
        email: 'contact@cityconstruction.com',
        plan: 'Business',
        status: 'Active',
        settings: {
          timezone: 'America/Chicago',
          language: 'en',
          dateFormat: 'MM/DD/YYYY',
          currency: 'USD',
          emailNotifications: true,
          dataRetention: 1825, // 5 years
          twoFactorAuth: false,
          sso: false,
          customBranding: false,
        },
        subscription: {
          id: 'sub-2',
          planId: 'business',
          status: 'active',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          billingEmail: 'billing@cityconstruction.com',
        },
        createdAt: '2024-06-01',
        updatedAt: '2024-12-01',
        maxUsers: 25,
        maxProjects: 10,
      },
    ];

    setTenants(mockTenants);
    setCurrentTenant(mockTenants[0]);

    // Mock tenant members
    const mockMembers: TenantMember[] = [
      {
        id: 'tm1',
        tenantId: 't1',
        userId: 'u2',
        name: 'Sarah Mitchell',
        email: 'sarah@buildpro.com',
        role: 'owner',
        joinedAt: '2024-01-15',
        lastActive: new Date().toISOString(),
        isActive: true,
      },
      {
        id: 'tm2',
        tenantId: 't1',
        userId: 'u3',
        name: 'Mike Thompson',
        email: 'mike@buildpro.com',
        role: 'admin',
        joinedAt: '2024-02-01',
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      },
    ];

    setTenantMembers(mockMembers);

    // Mock usage data
    const mockUsage: TenantUsage = {
      tenantId: 't1',
      currentUsers: 42,
      currentProjects: 12,
      currentStorage: 2048,
      currentApiCalls: 125000,
      period: '2024-12',
      limit: {
        users: 100,
        projects: 50,
        storage: 5120,
        apiCalls: 1000000,
      },
    };

    setTenantUsage(mockUsage);
  }, []);

  const addTenant = useCallback(async (tenant: Tenant) => {
    try {
      setIsLoading(true);
      setError(null);
      setTenants((prev) => [tenant, ...prev]);
      addAuditLog({
        id: `log-${Date.now()}`,
        tenantId: tenant.id,
        userId: 'current-user',
        userName: 'System',
        action: 'create',
        resource: 'tenant',
        resourceId: tenant.id,
        status: 'success',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tenant');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTenant = useCallback(async (id: string, updates: Partial<Tenant>) => {
    try {
      setIsLoading(true);
      setError(null);
      setTenants((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
      );
      setCurrentTenant((prev) =>
        prev?.id === id ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : prev
      );
      addAuditLog({
        id: `log-${Date.now()}`,
        tenantId: id,
        userId: 'current-user',
        userName: 'System',
        action: 'update',
        resource: 'tenant',
        resourceId: id,
        changes: updates,
        status: 'success',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tenant');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteTenant = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setTenants((prev) => prev.filter((t) => t.id !== id));
      if (currentTenant?.id === id) {
        setCurrentTenant(null);
      }
      addAuditLog({
        id: `log-${Date.now()}`,
        tenantId: id,
        userId: 'current-user',
        userName: 'System',
        action: 'delete',
        resource: 'tenant',
        resourceId: id,
        status: 'success',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tenant');
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant]);

  const getTenantById = useCallback((id: string) => {
    return tenants.find((t) => t.id === id);
  }, [tenants]);

  const updateTenantSettings = useCallback(async (tenantId: string, settings: Partial<TenantSettings>) => {
    try {
      setIsLoading(true);
      setError(null);
      setTenants((prev) =>
        prev.map((t) =>
          t.id === tenantId ? { ...t, settings: { ...t.settings, ...settings } } : t
        )
      );
      addAuditLog({
        id: `log-${Date.now()}`,
        tenantId,
        userId: 'current-user',
        userName: 'System',
        action: 'update_settings',
        resource: 'tenant_settings',
        resourceId: tenantId,
        changes: settings,
        status: 'success',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTenantSettings = useCallback((tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant?.settings || null;
  }, [tenants]);

  const addTenantMember = useCallback(async (member: TenantMember) => {
    try {
      setIsLoading(true);
      setError(null);
      setTenantMembers((prev) => [member, ...prev]);
      addAuditLog({
        id: `log-${Date.now()}`,
        tenantId: member.tenantId,
        userId: 'current-user',
        userName: 'System',
        action: 'add_member',
        resource: 'tenant_member',
        resourceId: member.id,
        status: 'success',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeTenantMember = useCallback(async (tenantId: string, memberId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setTenantMembers((prev) => prev.filter((m) => !(m.tenantId === tenantId && m.id === memberId)));
      addAuditLog({
        id: `log-${Date.now()}`,
        tenantId,
        userId: 'current-user',
        userName: 'System',
        action: 'remove_member',
        resource: 'tenant_member',
        resourceId: memberId,
        status: 'success',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTenantMemberRole = useCallback(
    async (tenantId: string, memberId: string, role: TenantMember['role']) => {
      try {
        setIsLoading(true);
        setError(null);
        setTenantMembers((prev) =>
          prev.map((m) => (m.id === memberId && m.tenantId === tenantId ? { ...m, role } : m))
        );
        addAuditLog({
          id: `log-${Date.now()}`,
          tenantId,
          userId: 'current-user',
          userName: 'System',
          action: 'update_member_role',
          resource: 'tenant_member',
          resourceId: memberId,
          changes: { role },
          status: 'success',
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update member role');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const addAuditLog = useCallback(async (log: TenantAuditLog) => {
    setAuditLogs((prev) => [log, ...prev].slice(0, 1000)); // Keep last 1000 logs
  }, []);

  const getTenantAuditLogs = useCallback(
    (tenantId: string) => {
      return auditLogs.filter((log) => log.tenantId === tenantId);
    },
    [auditLogs]
  );

  const updateTenantUsage = useCallback(async (usage: TenantUsage) => {
    try {
      setIsLoading(true);
      setError(null);
      setTenantUsage(usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update usage');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTenantUsagePercentage = useCallback(
    (tenantId: string, metric: 'users' | 'projects' | 'storage') => {
      if (!tenantUsage || tenantUsage.tenantId !== tenantId) return 0;

      const limits = tenantUsage.limit;
      switch (metric) {
        case 'users':
          return limits.users ? (tenantUsage.currentUsers / limits.users) * 100 : 0;
        case 'projects':
          return limits.projects ? (tenantUsage.currentProjects / limits.projects) * 100 : 0;
        case 'storage':
          return limits.storage ? (tenantUsage.currentStorage / limits.storage) * 100 : 0;
        default:
          return 0;
      }
    },
    [tenantUsage]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        setCurrentTenant,
        tenants,
        setTenants,
        addTenant,
        updateTenant,
        deleteTenant,
        getTenantById,
        updateTenantSettings,
        getTenantSettings,
        tenantMembers,
        addTenantMember,
        removeTenantMember,
        updateTenantMemberRole,
        auditLogs,
        addAuditLog,
        getTenantAuditLogs,
        tenantUsage,
        updateTenantUsage,
        getTenantUsagePercentage,
        isLoading,
        error,
        clearError,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export default TenantContext;
