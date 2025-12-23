import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';
import { supabase } from '@/services/supabaseClient';
import { db } from '@/services/db';
import { useTenant } from '@/contexts/TenantContext';

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<{ user: UserProfile | null; error: Error | null }>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  addProjectId: (id: string) => void;
  refreshPermissions: () => Promise<void>;
  isSupabaseConnected: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isFetchingPermissions, setIsFetchingPermissions] = useState(false);

  const { tenant } = useTenant();

  useEffect(() => {
    if (user && tenant) {
      refreshPermissions();
    }
  }, [tenant?.id, user?.id]);

  useEffect(() => {
    // Check if Supabase is configured by attempting to get a session
    // If the URL/Key are missing, this might fail or return null
    const initSupabase = async () => {
      try {
        // Check if env vars are present (basic check)
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          return;
        }

        setIsSupabaseConnected(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          mapSupabaseUser(session.user);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            mapSupabaseUser(session.user);
            setToken(session.access_token);
          } else {
            // Session expired or logged out
            setUser(null);
            setToken(null);
          }
        });

        return () => subscription.unsubscribe();
      } catch (e) {
        console.warn("Supabase initialization skipped:", e);
      }
    };

    initSupabase();
  }, []);

  const mapSupabaseUser = async (authUser: any) => {
    const newUser: UserProfile = {
      id: authUser.id,
      name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
      email: authUser.email || '',
      phone: authUser.phone || '',
      role: (authUser.user_metadata?.role as UserRole) || UserRole.OPERATIVE,
      permissions: authUser.user_metadata?.permissions || [],
      memberships: authUser.user_metadata?.memberships || [],
      avatarInitials: ((authUser.email || 'U')[0]).toUpperCase(),
      companyId: authUser.user_metadata?.companyId || 'c1',
      projectIds: []
    };
    setUser(newUser);
    // Initial permission fetch
    refreshPermissions(newUser.id);
  };

  const refreshPermissions = async (userId?: string) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return;

    try {
      setIsFetchingPermissions(true);
      const permissions = await db.getUserPermissions();
      setUser(prev => prev ? { ...prev, permissions } : null);
    } catch (e) {
      console.error("Failed to refresh permissions:", e);
    } finally {
      setIsFetchingPermissions(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!authUser) throw new Error("No user returned from Supabase");

      const newUser: UserProfile = {
        id: authUser.id,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        phone: authUser.phone || '',
        role: (authUser.user_metadata?.role as UserRole) || UserRole.OPERATIVE,
        permissions: authUser.user_metadata?.permissions || [],
        memberships: authUser.user_metadata?.memberships || [],
        avatarInitials: ((authUser.email || 'U')[0]).toUpperCase(),
        companyId: authUser.user_metadata?.companyId || 'c1',
        projectIds: []
      };

      // Update state immediately (optimistic)
      setUser(newUser);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) setToken(session.access_token);

      // Return fresh user directly to caller
      return { user: newUser, error: null };
    } catch (e: any) {
      console.error("Login exception:", e);
      return { user: null, error: e };
    }
  };

  const logout = async () => {
    // 1. Clear Supabase Session
    if (user && user.id.length > 10 && isSupabaseConnected) {
      await supabase.auth.signOut();
    }

    // 2. Clear Local State
    setUser(null);

    // 3. Clear Storage (Clean Slate)
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    // Clear any potential app-specific keys
    sessionStorage.clear();

    // 4. Force Reload to clear in-memory sensitive data (Redux/Context/Zustand)
    // This prevents "back button" access to protected pages
    window.location.reload();
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;

    // Superadmin override
    if (user.permissions.includes('*')) return true;

    // Direct match
    if (user.permissions.includes(permission)) return true;

    // Wildcard match (e.g., 'projects.*' matches 'projects.create')
    const [resource] = permission.split('.');
    if (user.permissions.includes(`${resource}.*`)) return true;

    return false;
  };

  const addProjectId = (projectId: string) => {
    if (user && user.projectIds && !user.projectIds.includes(projectId) && !user.projectIds.includes('ALL')) {
      setUser({
        ...user,
        projectIds: [...user.projectIds, projectId]
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission, addProjectId, refreshPermissions, isSupabaseConnected, token }}>
      {children}
    </AuthContext.Provider>
  );
};
