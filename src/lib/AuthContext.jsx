import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const authInFlightRef = useRef(false);

  const ensureUserInDb = useCallback(async (authUser) => {
    if (!authUser?.id) return null;
    const email = authUser.email ?? '';
    const fullName = authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? '';
    const avatarUrl = authUser.user_metadata?.avatar_url ?? authUser.user_metadata?.picture ?? '';

    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from('profiles').insert({
        id: authUser.id,
        email,
        full_name: fullName,
        avatar_url: avatarUrl,
        created_at: new Date().toISOString(),
      });
      if (error) {
        if (error.code !== '23505') throw error;
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    return {
      id: authUser.id,
      email: profile?.email || email,
      full_name: profile?.full_name || fullName,
      display_name: profile?.display_name ?? (profile?.full_name || fullName)?.split(' ')[0] ?? '',
      photo_url: profile?.avatar_url || profile?.photo_url || avatarUrl,
      brand: profile?.brand ?? '',
      model: profile?.model ?? '',
      color: profile?.color ?? 'gris',
      vehicle_type: profile?.vehicle_type ?? 'car',
      plate: profile?.plate ?? '',
      phone: profile?.phone ?? '',
      allow_phone_calls: profile?.allow_phone_calls ?? false,
      notifications_enabled: profile?.notifications_enabled !== false,
      email_notifications: profile?.email_notifications !== false,
      ...authUser,
    };
  }, []);

  const resolveSession = useCallback(async () => {
    if (authInFlightRef.current) return;
    authInFlightRef.current = true;
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        return;
      }
      const appUser = await ensureUserInDb(authUser);
      if (!appUser?.id) {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        return;
      }
      setUser(appUser);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      } else {
        setProfile({});
      }
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth resolve failed:', error);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'unknown', message: error?.message || 'Error de autenticación' });
    } finally {
      setIsLoadingAuth(false);
      authInFlightRef.current = false;
    }
  }, [ensureUserInDb]);

  useEffect(() => {
    resolveSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') {
        setIsLoadingAuth(false);
        return;
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (authInFlightRef.current || !session?.user?.id) {
          setIsLoadingAuth(false);
          return;
        }
        authInFlightRef.current = true;
        try {
          const appUser = await ensureUserInDb(session.user);
          if (appUser?.id) {
            setUser(appUser);
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            if (profileData) setProfile(profileData);
            else setProfile({});
            setIsAuthenticated(true);
            setAuthError(null);
          }
        } catch (err) {
          console.error('Auth state change error:', err);
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
        } finally {
          setIsLoadingAuth(false);
          authInFlightRef.current = false;
        }
        return;
      }
      setIsLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, [resolveSession, ensureUserInDb]);

  const checkUserAuth = useCallback(async () => {
    await resolveSession();
  }, [resolveSession]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      setProfile(data ?? {});
    } catch (err) {
      console.error('refreshProfile failed:', err);
    }
  }, [user?.id]);

  const logout = useCallback(async (shouldRedirect = false) => {
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    await supabase.auth.signOut();
    if (shouldRedirect) {
      window.location.href = window.location.origin;
    }
  }, []);

  const navigateToLogin = useCallback(() => {
    // No-op when using Supabase; Login is shown by AuthRouter when !user?.id
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      profile: profile ?? {},
      setProfile,
      isAuthenticated,
      isLoadingAuth,
      authError,
      appPublicSettings: null,
      isLoadingPublicSettings: false,
      logout,
      navigateToLogin,
      checkAppState: checkUserAuth,
      checkUserAuth,
      refreshProfile,
    }),
    [user, profile, isAuthenticated, isLoadingAuth, authError, logout, navigateToLogin, checkUserAuth, refreshProfile]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
