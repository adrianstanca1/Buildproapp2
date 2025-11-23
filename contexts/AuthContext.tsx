import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase } from '../services/supabaseClient';

interface AuthContextType
{
  user: UserProfile | null;
  login: ( role: UserRole ) => void;
  logout: () => void;
  hasPermission: ( allowedRoles: UserRole[] ) => boolean;
  addProjectId: ( id: string ) => void;
  isSupabaseConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>( undefined );

export const useAuth = () =>
{
  const context = useContext( AuthContext );
  if ( !context )
  {
    throw new Error( 'useAuth must be used within an AuthProvider' );
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ( { children } ) =>
{
  const [ user, setUser ] = useState<UserProfile | null>( null );
  const [ isSupabaseConnected, setIsSupabaseConnected ] = useState( false );

  useEffect( () =>
  {
    // Check if Supabase is configured by attempting to get a session
    // If the URL/Key are missing, this might fail or return null
    const initSupabase = async () =>
    {
      try
      {
        // Check if env vars are present (basic check)
        if ( !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY )
        {
          return;
        }

        setIsSupabaseConnected( true );

        const { data: { session } } = await supabase.auth.getSession();
        if ( session?.user )
        {
          mapSupabaseUser( session.user );
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange( ( _event, session ) =>
        {
          if ( session?.user )
          {
            mapSupabaseUser( session.user );
          } else
          {
            // Only clear if we are not using a demo account
            setUser( prev =>
            {
              // Demo accounts have short IDs (u1, u2, etc)
              // Supabase accounts have UUIDs
              if ( prev && prev.id.length < 10 )
              {
                return prev;
              }
              return null;
            } );
          }
        } );

        return () => subscription.unsubscribe();
      } catch ( e )
      {
        console.warn( "Supabase initialization skipped:", e );
      }
    };

    initSupabase();
  }, [] );

  const mapSupabaseUser = ( authUser: any ) =>
  {
    const newUser: UserProfile = {
      id: authUser.id,
      name: authUser.user_metadata?.full_name || authUser.email?.split( '@' )[ 0 ] || 'User',
      email: authUser.email || '',
      phone: authUser.phone || '',
      role: ( authUser.user_metadata?.role as UserRole ) || UserRole.OPERATIVE,
      avatarInitials: ( ( authUser.email || 'U' )[ 0 ] ).toUpperCase(),
      companyId: authUser.user_metadata?.companyId || 'c1',
      projectIds: []
    };
    setUser( newUser );
  };

  const login = ( role: UserRole ) =>
  {
    // Simulating backend user retrieval based on role selection
    let mockUser: UserProfile;

    switch ( role )
    {
      case UserRole.SUPER_ADMIN:
        mockUser = {
          id: 'u1',
          name: 'John Anderson',
          email: 'john@buildcorp.com',
          phone: '+44 7700 900001',
          role: UserRole.SUPER_ADMIN,
          avatarInitials: 'JA',
          companyId: 'ALL',
          projectIds: [ 'ALL' ]
        };
        break;
      case UserRole.COMPANY_ADMIN:
        mockUser = {
          id: 'u2',
          name: 'Sarah Mitchell',
          email: 'sarah@buildcorp.com',
          phone: '+44 7700 900002',
          role: UserRole.COMPANY_ADMIN,
          avatarInitials: 'SM',
          companyId: 'c1',
          projectIds: [ 'p1', 'p2' ]
        };
        break;
      case UserRole.SUPERVISOR:
        mockUser = {
          id: 'u3',
          name: 'Mike Thompson',
          email: 'mike@buildcorp.com',
          phone: '+44 7700 900003',
          role: UserRole.SUPERVISOR,
          avatarInitials: 'MT',
          companyId: 'c1',
          projectIds: [ 'p1' ]
        };
        break;
      case UserRole.OPERATIVE:
        mockUser = {
          id: 'u4',
          name: 'David Chen',
          email: 'david@buildcorp.com',
          phone: '+44 7700 900004',
          role: UserRole.OPERATIVE,
          avatarInitials: 'DC',
          companyId: 'c1',
          projectIds: [ 'p1' ]
        };
        break;
      default:
        return;
    }
    setUser( mockUser );
  };

  const logout = async () =>
  {
    if ( user && user.id.length > 10 && isSupabaseConnected )
    {
      await supabase.auth.signOut();
    }
    setUser( null );
  };

  const hasPermission = ( allowedRoles: UserRole[] ) =>
  {
    if ( !user ) return false;
    return allowedRoles.includes( user.role );
  };

  const addProjectId = ( projectId: string ) =>
  {
    if ( user && user.projectIds && !user.projectIds.includes( projectId ) && !user.projectIds.includes( 'ALL' ) )
    {
      setUser( {
        ...user,
        projectIds: [ ...user.projectIds, projectId ]
      } );
    }
  };

  return (
    <AuthContext.Provider value={ { user, login, logout, hasPermission, addProjectId, isSupabaseConnected } }>
      { children }
    </AuthContext.Provider>
  );
};
