import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { getSupabase, clearSupabaseAuthStorage } from '@/lib/supabaseClient';

const isDevIos = () => import.meta.env.DEV && Capacitor.getPlatform?.() === 'ios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const authInFlightRef = useRef(false);

  const ensureUserInDb = useCallback(async (authUser) => {
    const supabase = getSupabase();
    if (!supabase || !authUser?.id) return null;
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
    const supabase = getSupabase();
    if (!supabase) {
      setIsLoadingAuth(false);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      return;
    }
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

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileError) {
        console.error("PROFILE LOAD ERROR:", profileError);
      }
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
    // Bypass login en DEV + iOS simulator para probar mapa (OAuth no funciona en capacitor://localhost)
    if (isDevIos()) {
      const devUser = {
        id: 'dev-user',
        email: 'dev@waitme.local',
        full_name: 'Dev User',
        display_name: 'Dev',
        photo_url: null,
        brand: '',
        model: '',
        color: 'gris',
        vehicle_type: 'car',
        plate: '',
        phone: null,
        allow_phone_calls: false,
        notifications_enabled: true,
        email_notifications: true,
      };
      setUser(devUser);
      setProfile(devUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setIsLoadingAuth(false);
      return;
    }

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
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            if (profileError) console.error("PROFILE LOAD ERROR:", profileError);
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

    // Procesar OAuth redirect: #access_token en la URL (web)
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token })
          .then(() => {
            window.history.replaceState(null, '', window.location.pathname + '#/');
          })
          .catch(() => {})
          .finally(() => resolveSession());
        return () => subscription.unsubscribe();
      }
    }

    resolveSession();

    return () => subscription.unsubscribe();
  }, [resolveSession, ensureUserInDb]);

  const checkUserAuth = useCallback(async () => {
    await resolveSession();
  }, [resolveSession]);

  const refreshProfile = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !user?.id) return;
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
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    await clearSupabaseAuthStorage();
    if (shouldRedirect) {
      window.location.href = window.location.origin + '/';
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
