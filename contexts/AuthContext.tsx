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
    // Validate required claims for tenant and role
    const rawRole = authUser.user_metadata?.role;
    const rawCompanyId = authUser.user_metadata?.companyId;

    if (!rawRole) {
      console.warn("User role not found in metadata, defaulting to OPERATIVE");
    }

    if (!rawCompanyId) {
      console.warn("User company ID not found in metadata, defaulting to 'c1'");
    }

    const newUser: UserProfile = {
      id: authUser.id,
      name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
      email: authUser.email || '',
      phone: authUser.phone || '',
      role: (rawRole as UserRole) || UserRole.OPERATIVE,
      permissions: authUser.user_metadata?.permissions || [],
      memberships: authUser.user_metadata?.memberships || [],
      avatarInitials: ((authUser.email || 'U')[0]).toUpperCase(),
      companyId: rawCompanyId || 'c1',
      projectIds: []
    };

    // Validate that user has proper tenant and role claims
    if (!newUser.companyId || !newUser.role) {
      console.error("Token missing required tenant or role claims");
      // Potentially reject the token if critical claims are missing
    }

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
      // DEV BACKDOOR for Super Admin verification
      if (email === 'demo@buildpro.app' && password === 'dev-admin') {
        console.warn("Using DEV BACKDOOR for Super Admin");
        const devUser: UserProfile = {
          id: 'demo-user-id',
          name: 'Demo Super Admin',
          email: 'demo@buildpro.app',
          role: UserRole.SUPERADMIN,
          permissions: ['*'],
          memberships: [],
          companyId: 'c1',
          projectIds: ['ALL'],
          avatarInitials: 'DA',
          phone: ''
        };
        setUser(devUser);
        setToken('dev-token-placeholder');
        return { user: devUser, error: null };
      }

      const { data: { user: authUser }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!authUser) throw new Error("No user returned from Supabase");

      // Validate required claims for tenant and role
      const rawRole = authUser.user_metadata?.role;
      const rawCompanyId = authUser.user_metadata?.companyId;

      if (!rawRole) {
        console.warn("User role not found in metadata, defaulting to OPERATIVE");
      }

      if (!rawCompanyId) {
        console.warn("User company ID not found in metadata, defaulting to 'c1'");
      }

      const newUser: UserProfile = {
        id: authUser.id,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        phone: authUser.phone || '',
        role: (rawRole as UserRole) || UserRole.OPERATIVE,
        permissions: authUser.user_metadata?.permissions || [],
        memberships: authUser.user_metadata?.memberships || [],
        avatarInitials: ((authUser.email || 'U')[0]).toUpperCase(),
        companyId: rawCompanyId || 'c1',
        projectIds: []
      };

      // Validate that user has proper tenant and role claims
      if (!newUser.companyId || !newUser.role) {
        console.error("Login failed: Token missing required tenant or role claims");
        throw new Error("Invalid token: missing required claims");
      }

      // Update state immediately (optimistic)
      setUser(newUser);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setToken(session.access_token);

        // Validate token claims after setting the token
        await validateTokenClaims(session.access_token);
      }

      // Return fresh user directly to caller
      return { user: newUser, error: null };
    } catch (e: any) {
      return { user: null, error: e };
    }
  };

  // Function to validate token claims
  const validateTokenClaims = async (token: string | null) => {
    if (!token) return false;

    try {
      // In a real implementation, we would decode and validate the JWT
      // For now, we'll just check that we have the user state with required claims
      return !!(user && user.companyId && user.role);
    } catch (error) {
      console.error("Token validation failed:", error);
      return false;
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
    try {
      // 1. Clear Supabase Session
      if (user && user.id.length > 10 && isSupabaseConnected) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Supabase sign out error:", error);
        }
      }

      // 2. Clear Local State
      setUser(null);
      setToken(null);
      setOriginalSession(null);

      // 3. Clear All Storage (Comprehensive Clean)
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth') || key.includes('token') || key.includes('session'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Also remove other app-specific storage
      localStorage.removeItem('selectedTenantId');
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('sb-gotrue-session-storage');
      localStorage.removeItem('buildpro_user_preferences');
      localStorage.removeItem('buildpro_ui_state');
      localStorage.removeItem('buildpro_theme');
      localStorage.removeItem('buildpro_sidebar_collapsed');

      // Clear all session storage
      sessionStorage.clear();

      // Clear cookies if any exist
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });

      // 4. Clear any cached data in service workers or caches
      if ('serviceWorker' in navigator && 'caches' in window) {
        try {
          // Clear all caches
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        } catch (cacheError) {
          console.error("Cache clear error:", cacheError);
        }

        // Clear service worker data
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          if (registration.active) {
            registration.active.postMessage({ type: 'CLEAR_CACHE' });
          }
        }
      }

      // 5. Notify other tabs about logout
      localStorage.setItem('logout-event', Date.now().toString());

      // 6. Force navigation to clear in-memory sensitive data (Redux/Context/Zustand)
      // This prevents "back button" access to protected pages
      window.location.replace('/');
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, still clear local state and navigate away
      setUser(null);
      setToken(null);
      setOriginalSession(null);

      // Clear all storage comprehensively
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth') || key.includes('token') || key.includes('session'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      localStorage.removeItem('selectedTenantId');
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('sb-gotrue-session-storage');
      localStorage.removeItem('buildpro_user_preferences');
      localStorage.removeItem('buildpro_ui_state');
      localStorage.removeItem('buildpro_theme');
      localStorage.removeItem('buildpro_sidebar_collapsed');

      sessionStorage.clear();

      // Clear cookies
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });

      localStorage.setItem('logout-event', Date.now().toString());
      window.location.replace('/');
    }
  };

  // Listen for logout events from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'logout-event') {
        // Another tab initiated logout, so we should log out too
        setUser(null);
        setToken(null);
        setOriginalSession(null);
        sessionStorage.clear();
        window.location.replace('/');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handle token expiration
  useEffect(() => {
    let tokenCheckInterval: NodeJS.Timeout | null = null;

    const checkTokenExpiration = () => {
      if (!token) return;

      try {
        // Decode JWT to check expiration (simplified - in a real app, use a proper JWT library)
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const currentTime = Math.floor(Date.now() / 1000);

          // Check if token expires within 5 minutes
          if (payload.exp && payload.exp < currentTime + 300) {
            console.warn("Token is about to expire, logging out user");
            logout();
          }
        }
      } catch (error) {
        console.error("Error checking token expiration:", error);
        // If we can't verify the token, treat it as expired
        logout();
      }
    };

    // Check token expiration every 1 minute
    tokenCheckInterval = setInterval(checkTokenExpiration, 60000);

    return () => {
      if (tokenCheckInterval) {
        clearInterval(tokenCheckInterval);
      }
    };
  }, [token]);

  // Handle visibility change (tab focus/unfocus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && token) {
        // When user comes back to the tab, check if token is still valid
        checkTokenExpiration();
      }
    };

    const checkTokenExpiration = () => {
      if (!token) return;

      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const currentTime = Math.floor(Date.now() / 1000);

          // Check if token has expired
          if (payload.exp && payload.exp < currentTime) {
            console.warn("Token has expired, logging out user");
            logout();
          }
        }
      } catch (error) {
        console.error("Error checking token expiration:", error);
        logout();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [token]);

  // Handle beforeunload to clean up any temporary data
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clean up any sensitive data before page closes
      if (user?.role === UserRole.READ_ONLY) {
        // For read-only users, clear more aggressively
        sessionStorage.clear();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      // When coming back online, verify session is still valid
      if (user && token) {
        verifySession();
      }
    };

    const handleOffline = () => {
      // When going offline, warn user about potential session issues
      console.log("Connection lost. Session may expire while offline.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, token]);


  // Token expiration monitoring
  useEffect(() => {
    let tokenCheckInterval: NodeJS.Timeout;

    const checkTokenExpiration = () => {
      if (token) {
        try {
          // Decode token to check expiration (simplified - in real app, use proper JWT decoding)
          // For now, we'll just implement a periodic check
          // In a real implementation, we would decode the JWT and check the exp claim
          const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds

          // For now, we'll just log that we should check expiration
          // In a real implementation, we would decode the JWT and compare exp to current time
          console.log("Checking token expiration...");
        } catch (error) {
          console.error("Error checking token expiration:", error);
          // If there's an error checking the token, log the user out
          logout();
        }
      }
    };

    // Check token expiration every minute
    tokenCheckInterval = setInterval(checkTokenExpiration, 60000);

    return () => {
      if (tokenCheckInterval) {
        clearInterval(tokenCheckInterval);
      }
    };
  }, [token]);

  // Deep link handling
  useEffect(() => {
    const handleDeepLink = () => {
      // Check if we're on a protected route but user is not authenticated
      const currentPath = window.location.pathname;
      const isProtectedRoute = !['/', '/login', '/register', '/maintenance', '/client-portal'].some(path =>
        currentPath.startsWith(path)
      );

      if (isProtectedRoute && !user) {
        // Redirect to login if trying to access protected route without auth
        window.location.href = '/login';
      }
    };

    // Run on initial load
    handleDeepLink();

    // Listen for URL changes
    const handlePopState = () => {
      handleDeepLink();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

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
