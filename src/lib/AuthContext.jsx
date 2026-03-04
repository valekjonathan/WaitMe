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
      email: profile?.email || email,
      full_name: profile?.full_name || fullName,
      display_name: profile?.display_name ?? (profile?.full_name || fullName)?.split(' ')[0] ?? '',
      photo_url: profile?.avatar_url || profile?.photo_url || avatarUrl,
      car_brand: profile?.car_brand ?? '',
      car_model: profile?.car_model ?? '',
      car_color: profile?.car_color ?? 'gris',
      vehicle_type: profile?.vehicle_type ?? 'car',
      car_plate: profile?.car_plate ?? '',
      phone: profile?.phone ?? '',
      allow_phone_calls: profile?.allow_phone_calls ?? false,
      notifications_enabled: profile?.notifications_enabled !== false,
      email_notifications: profile?.email_notifications !== false,
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

  const updateProfileFromDb = useCallback(async (userId) => {
    if (!userId) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!data) return;
    setUser((prev) => {
      if (!prev || prev.id !== userId) return prev;
      return {
        ...prev,
        full_name: data.full_name ?? prev.full_name,
        car_brand: data.car_brand ?? prev.car_brand,
        car_model: data.car_model ?? prev.car_model,
        car_color: data.car_color ?? prev.car_color ?? 'gris',
        vehicle_type: data.vehicle_type ?? prev.vehicle_type ?? 'car',
        car_plate: data.car_plate ?? prev.car_plate,
        phone: data.phone ?? prev.phone,
        photo_url: data.avatar_url ?? data.photo_url ?? prev.photo_url,
        allow_phone_calls: data.allow_phone_calls ?? prev.allow_phone_calls,
        notifications_enabled: data.notifications_enabled !== false,
        email_notifications: data.email_notifications !== false,
      };
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      profile: user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      appPublicSettings: null,
      isLoadingPublicSettings: false,
      logout,
      navigateToLogin,
      checkAppState: checkUserAuth,
      checkUserAuth,
      updateProfileFromDb,
    }),
    [user, isAuthenticated, isLoadingAuth, authError, logout, navigateToLogin, checkUserAuth, updateProfileFromDb]
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
