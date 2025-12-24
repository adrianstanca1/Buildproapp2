import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';
import { supabase } from '@/services/supabaseClient';
import { db } from '@/services/db';

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<{ user: UserProfile | null; error: Error | null }>;
  signup: (email: string, password: string, name: string, companyName: string) => Promise<{ user: UserProfile | null; error: Error | null }>;
  logout: () => void;

  hasPermission: (permission: string) => boolean;
  addProjectId: (id: string) => void;
  refreshPermissions: () => Promise<void>;
  isSupabaseConnected: boolean;
  token: string | null;
  impersonateUser: (userId: string) => Promise<void>;
  stopImpersonating: () => void;
  isImpersonating: boolean;
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

  const [originalSession, setOriginalSession] = useState<{ user: UserProfile; token: string } | null>(null);

  useEffect(() => {
    // Check if Supabase is configured by attempting to get a session
    // If the URL/Key are missing, this might fail or return null
    const initSupabase = async () => {
      try {
        // Check if Supabase is configured (either via env or fallback)
        // We check if the supabase client has a valid URL configured
        // @ts-expect-error - inspecting internal client config is a safe heuristic here
        const clientUrl = supabase.supabaseUrl;

        if (!clientUrl || clientUrl.includes('placeholder')) {
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
      return { user: null, error: e };
    }
  };

  const signup = async (email: string, password: string, name: string, companyName: string) => {
    try {
      // 1. Supabase Sign Up
      const { data: { user: authUser, session }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            company_name: companyName,
            role: UserRole.COMPANY_ADMIN // Initial user is admin of their company
          }
        }
      });

      if (error) throw error;
      if (!authUser) throw new Error("No user returned from Supabase SignUp");

      // 2. Sync with Backend
      if (session) {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            userId: authUser.id,
            email,
            name,
            companyName
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Backend registration failed');
        }
        setToken(session.access_token);
      } else {
        console.log("User registered but no session (confirm email?).");
        return { user: null, error: new Error("Please check your email to confirm your account.") };
      }

      // 3. Map User
      const newUser: UserProfile = {
        id: authUser.id,
        name: name,
        email: email,
        phone: '',
        role: UserRole.COMPANY_ADMIN,
        permissions: [],
        memberships: [],
        avatarInitials: name[0].toUpperCase(),
        companyId: 'pending',
        projectIds: []
      };

      setUser(newUser);
      return { user: newUser, error: null };

    } catch (e: any) {
      console.error("Signup exception:", e);
      return { user: null, error: e };
    }
  };

  const impersonateUser = async (userId: string) => {
    if (!user || user.role !== UserRole.SUPERADMIN) throw new Error("Unauthorized");

    try {
      const { user: impersonatedUser, token: newToken } = await db.impersonateUser(userId);
      // Save original session
      if (!originalSession) {
        setOriginalSession({ user, token: token || '' });
      }

      setUser(impersonatedUser);
      setToken(newToken);
      // Note: We don't update Supabase session here to avoid side effects, strictly local state override
    } catch (e) {
      console.error("Impersonation failed:", e);
      throw e;
    }
  };

  const stopImpersonating = () => {
    if (originalSession) {
      setUser(originalSession.user);
      setToken(originalSession.token);
      setOriginalSession(null);
    }
  };

  const logout = async () => {
    // 1. Clear Supabase Session
    if (user && user.id.length > 10 && isSupabaseConnected) {
      await supabase.auth.signOut();
    }

    // 2. Clear Local State
    setUser(null);
    setToken(null);
    setOriginalSession(null);

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
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      hasPermission,
      addProjectId,
      refreshPermissions,
      isSupabaseConnected,
      token,
      impersonateUser,
      stopImpersonating,
      isImpersonating: !!originalSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};
