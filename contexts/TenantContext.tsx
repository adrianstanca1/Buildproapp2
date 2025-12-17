import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { db } from '@/services/db';
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

  // Impersonation
  isImpersonating: boolean;
  impersonateTenant: (tenantId: string) => Promise<void>;
  stopImpersonating: () => void;

  // Feature Flagging & Limits
  checkFeature: (featureName: string) => boolean;
  canAddResource: (resourceType: 'users' | 'projects') => boolean;
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

  // Initialize with real data from DB
  useEffect(() => {
    const initTenantData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Fetch Companies
        const fetchedTenants = await db.getCompanies();
        setTenants(fetchedTenants);

        let activeTenant = currentTenant;
        if (!activeTenant && fetchedTenants.length > 0) {
          activeTenant = fetchedTenants[0];
          setCurrentTenant(activeTenant);
          db.setTenantId(activeTenant.id);
        }

        if (activeTenant) {
          // 2. Fetch Usage & Audit Logs for active tenant
          const [usage, logs] = await Promise.all([
            db.getTenantUsage(activeTenant.id),
            db.getAuditLogs(activeTenant.id)
          ]);
          setTenantUsage(usage);
          setAuditLogs(logs);

          // 3. Apply Dynamic Branding
          applyBranding(activeTenant.settings);
        }
      } catch (e) {
        console.error("Failed to initialize tenant data", e);
        setError("Failed to initialize tenant data");
      } finally {
        setIsLoading(false);
      }
    };
    initTenantData();
  }, [currentTenant?.id]);

  const [isImpersonating, setIsImpersonating] = useState(false);

  const impersonateTenant = useCallback(async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setCurrentTenant(tenant);
      db.setTenantId(tenant.id);
      setIsImpersonating(true);
      // Re-apply branding
      applyBranding(tenant.settings);
    }
  }, [tenants]);

  const stopImpersonating = useCallback(() => {
    // Return to the first tenant (default behavior for now)
    if (tenants.length > 0) {
      setCurrentTenant(tenants[0]);
      db.setTenantId(tenants[0].id);
      setIsImpersonating(false);
      applyBranding(tenants[0].settings);
    }
  }, [tenants]);

  const applyBranding = (settings?: any) => {
    if (!settings) return;
    const root = document.documentElement;
    // Use loose property check for dynamic branding
    if (settings.primaryColor) root.style.setProperty('--primary', settings.primaryColor);
    if (settings.accentColor) root.style.setProperty('--accent', settings.accentColor);
  };

  const checkFeature = useCallback((featureName: string) => {
    if (!currentTenant) return false;
    // Enterprise has EVERYTHING
    if (currentTenant.plan === 'Enterprise') return true;

    const planFeatures: Record<string, string[]> = {
      'Starter': ['DASHBOARD', 'TASKS', 'DOCUMENTS'],
      'Business': ['DASHBOARD', 'TASKS', 'DOCUMENTS', 'AI_TOOLS', 'REPORTS', 'SCHEDULE', 'TEAM', 'FINANCIALS'],
      'Custom': currentTenant.features?.filter(f => f.enabled).map(f => f.name) || []
    };

    const allowed = planFeatures[currentTenant.plan] || [];
    return allowed.includes(featureName);
  }, [currentTenant]);

  const canAddResource = useCallback((resourceType: 'users' | 'projects') => {
    if (!currentTenant || !tenantUsage) return true;
    const limit = resourceType === 'users' ? tenantUsage.limit.users : tenantUsage.limit.projects;
    const current = resourceType === 'users' ? tenantUsage.currentUsers : tenantUsage.currentProjects;
    return !limit || current < limit;
  }, [currentTenant, tenantUsage]);

  const addTenant = useCallback(async (tenant: Tenant) => {
    try {
      setIsLoading(true);
      setError(null);
      const tenantWithId = { ...tenant, id: tenant.id || `c-${Date.now()}` };
      setTenants((prev) => [tenantWithId, ...prev]);
      await db.addCompany(tenantWithId);

      addAuditLog({
        id: `log-${Date.now()}`,
        tenantId: tenantWithId.id,
        userId: 'current-user',
        userName: 'System',
        action: 'create',
        resource: 'tenant',
        resourceId: tenantWithId.id,
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
      setCurrentTenant((prev) => {
        const updated = prev?.id === id ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : prev;
        if (updated && updated.id === id) {
          // If we updated the current tenant, ensure the ID didn't change (unlikely) or just re-sync if needed, 
          // but mainly we just need to keep `currentTenant` state fresh.
          // If ID changes (it shouldn't), we'd need to update db.setTenantId.
        }
        return updated;
      }
      );

      await db.updateCompany(id, updates);

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

      await db.deleteCompany(id);

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
        setCurrentTenant: (t) => {
          setCurrentTenant(t);
          db.setTenantId(t?.id || null);
        },
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
        isImpersonating,
        impersonateTenant,
        stopImpersonating,
        checkFeature,
        canAddResource,
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
