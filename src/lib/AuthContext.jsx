import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

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
      email: email || profile?.email,
      full_name: fullName || profile?.full_name,
      display_name: profile?.display_name ?? fullName?.split(' ')[0] ?? '',
      photo_url: avatarUrl || profile?.avatar_url || profile?.photo_url,
      car_brand: profile?.car_brand,
      car_model: profile?.car_model,
      car_color: profile?.car_color,
      vehicle_type: profile?.vehicle_type,
      car_plate: profile?.car_plate,
      phone: profile?.phone,
      allow_phone_calls: profile?.allow_phone_calls,
      notifications_enabled: profile?.notifications_enabled,
      email_notifications: profile?.email_notifications,
      ...authUser,
    };
  }, []);

  const resolveSession = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        return;
      }
      const appUser = await ensureUserInDb(authUser);
      if (!appUser?.id) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        return;
      }
      setUser(appUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth resolve failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'unknown', message: error?.message || 'Error de autenticación' });
    } finally {
      setIsLoadingAuth(false);
    }
  }, [ensureUserInDb]);

  useEffect(() => {
    resolveSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user?.id) {
          try {
            const appUser = await ensureUserInDb(session.user);
            if (appUser?.id) {
              setUser(appUser);
              setIsAuthenticated(true);
              setAuthError(null);
            }
          } catch (err) {
            console.error('Auth state change error:', err);
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, [resolveSession, ensureUserInDb]);

  const checkUserAuth = useCallback(async () => {
    await resolveSession();
  }, [resolveSession]);

  const logout = useCallback(async (shouldRedirect = false) => {
    setUser(null);
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
      isAuthenticated,
      isLoadingAuth,
      authError,
      appPublicSettings: null,
      isLoadingPublicSettings: false,
      logout,
      navigateToLogin,
      checkAppState: checkUserAuth,
      checkUserAuth,
    }),
    [user, isAuthenticated, isLoadingAuth, authError, logout, navigateToLogin, checkUserAuth]
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
