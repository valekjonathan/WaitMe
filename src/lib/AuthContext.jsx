import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { getSupabase, clearSupabaseAuthStorage } from '@/lib/supabaseClient';

const AUTH_TIMEOUT_MS = 8000;
const ENSURE_USER_TIMEOUT_MS = 5000;

// DEV AUTO LOGIN
const isDevAutoLogin = () => import.meta.env.DEV;

// DEV bypass: use real Supabase flow (for Google login in Simulator)
const isDevBypassAuth = () =>
  import.meta.env.DEV &&
  (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true' || import.meta.env.VITE_BYPASS_AUTH === 'true');

function authLog(...args) {
  try {
    const msg = args
      .map((a) => {
        if (a == null) return String(a);
        if (typeof a === 'object') {
          try {
            return JSON.stringify(a);
          } catch {
            return '[Object]';
          }
        }
        return String(a);
      })
      .join(' ');
    console.log(msg);
  } catch (_) {
    /* no-op: logs must never crash the app */
  }
}

/** Usuario mock para desarrollo local — nunca en producción */
const DEV_MOCK_USER = {
  id: 'dev-user',
  name: 'Dev User',
  full_name: 'Dev User',
  display_name: 'Dev',
  email: 'dev@waitme.app',
  avatar: null,
  photo_url: null,
  brand: 'Dev',
  model: 'Coche',
  color: 'gris',
  vehicle_type: 'car',
  plate: '0000XXX',
  phone: '000000000',
  allow_phone_calls: false,
  notifications_enabled: true,
  email_notifications: true,
};

const DEV_MOCK_PROFILE = {
  id: 'dev-user',
  display_name: 'Dev',
  full_name: 'Dev User',
  email: 'dev@waitme.app',
  avatar_url: null,
  vehicle_type: 'car',
  brand: 'Dev',
  model: 'Coche',
  color: 'gris',
  plate: '0000XXX',
  phone: '000000000',
  allow_phone_calls: false,
  notifications_enabled: true,
  email_notifications: true,
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const isDev = isDevAutoLogin() && !isDevBypassAuth();
  const [user, setUser] = useState(() => (isDev ? DEV_MOCK_USER : null));
  const [profile, setProfile] = useState(() => (isDev ? DEV_MOCK_PROFILE : null));
  const [isAuthenticated, setIsAuthenticated] = useState(isDev);
  const [isLoadingAuth, setIsLoadingAuth] = useState(!isDev);
  const [authError, setAuthError] = useState(null);

  const ensureUserInDb = useCallback(async (authUser) => {
    authLog('[AUTH LOAD 5] ensureUserInDb start', authUser?.id);
    const supabase = getSupabase();
    if (!supabase || !authUser?.id) {
      authLog('[AUTH LOAD 6] ensureUserInDb error: no supabase or authUser');
      return null;
    }
    const email = authUser.email ?? '';
    const fullName = authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? '';
    const avatarUrl = authUser.user_metadata?.avatar_url ?? authUser.user_metadata?.picture ?? '';

    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!existing) {
        const { error: insertErr } = await supabase.from('profiles').insert({
          id: authUser.id,
          email,
          full_name: fullName,
          avatar_url: avatarUrl,
          created_at: new Date().toISOString(),
        });
        if (insertErr) {
          authLog('[AUTH LOAD 6] ensureUserInDb error: insert failed', insertErr?.message);
          return null;
        }
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      authLog('[AUTH LOAD 6] ensureUserInDb success');
      return {
        id: authUser.id,
        email: profile?.email || email,
        full_name: profile?.full_name || fullName,
        display_name:
          profile?.display_name ?? (profile?.full_name || fullName)?.split(' ')[0] ?? '',
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
    } catch (err) {
      authLog('[AUTH LOAD 6] ensureUserInDb error', err?.message);
      return null;
    }
  }, []);

  const applySession = useCallback(
    async (session) => {
      if (!session?.user?.id) {
        authLog('[AUTH LOAD 4] applySession: no session.user.id');
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        setAuthError(null);
        setIsLoadingAuth(false);
        authLog('[AUTH LOAD 9] setIsLoadingAuth false (no session)');
        return;
      }
      authLog('[AUTH LOAD 4] applySession start', session.user.id);
      setIsLoadingAuth(true);
      try {
        const ensureWithTimeout = Promise.race([
          ensureUserInDb(session.user).catch(() => null),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('ensureUserInDb timeout')), ENSURE_USER_TIMEOUT_MS)
          ),
        ]);
        const appUser = await ensureWithTimeout;
        if (appUser?.id) {
          authLog('[AUTH LOAD 7] fallback session.user used false');
          setUser(appUser);
          authLog('[AUTH LOAD 8] setUser called true');
          const supabase = getSupabase();
          if (supabase) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            setProfile(profileData ?? {});
          }
          setIsAuthenticated(true);
          setAuthError(null);
        } else {
          authLog('[AUTH LOAD 7] fallback session.user used true (ensureUserInDb failed)');
          setUser(session.user);
          setProfile({});
          setIsAuthenticated(true);
          setAuthError(null);
          authLog('[AUTH LOAD 8] setUser called true (fallback)');
        }
        authLog('[AUTH LOAD 10] final auth state: user', !!session.user, 'isAuthenticated true');
      } catch (err) {
        authLog('[AUTH LOAD 6] ensureUserInDb error (catch/timeout)', err?.message);
        authLog('[AUTH LOAD 7] fallback session.user used true');
        setUser(session.user);
        setProfile({});
        setIsAuthenticated(true);
        setAuthError(null);
        authLog('[AUTH LOAD 8] setUser called true (fallback on error)');
        authLog('[AUTH LOAD 10] final auth state: user fallback, isAuthenticated true');
      } finally {
        setIsLoadingAuth(false);
        authLog('[AUTH LOAD 9] setIsLoadingAuth false (applySession finally)');
      }
    },
    [ensureUserInDb]
  );

  useEffect(() => {
    if (isDev) {
      authLog('[AUTH LOAD 1] mounted (isDev=true, skip auth)');
      return;
    }

    authLog('[AUTH LOAD 1] mounted');

    const supabase = getSupabase();
    if (!supabase) {
      authLog('[AUTH LOAD 2] getSupabase null');
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setAuthError(null);
      setIsLoadingAuth(false);
      authLog('[AUTH LOAD 9] setIsLoadingAuth false (no supabase)');
      return;
    }

    let mounted = true;

    const init = async () => {
      authLog('[AUTH LOAD 2] getSession start');
      try {
        const sessionPromise = supabase.auth
          .getSession()
          .then((r) => r?.data ?? null)
          .catch(() => null);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('getSession timeout')), AUTH_TIMEOUT_MS)
        );
        const data = await Promise.race([sessionPromise, timeoutPromise]);
        authLog('[AUTH LOAD 3] getSession session exists', !!data?.session);
        if (mounted && data?.session) {
          await applySession(data.session);
        } else if (mounted) {
          authLog('[AUTH LOAD 3] getSession null — no session');
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          setAuthError(null);
          setIsLoadingAuth(false);
          authLog('[AUTH LOAD 9] setIsLoadingAuth false (no session at init)');
        }
      } catch (err) {
        authLog('[AUTH LOAD 3] getSession error', err?.message);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          setAuthError(null);
          setIsLoadingAuth(false);
          authLog('[AUTH LOAD 9] setIsLoadingAuth false (getSession error)');
        }
      } finally {
        if (mounted) {
          setIsLoadingAuth(false);
          authLog('[AUTH LOAD 9] setIsLoadingAuth false (init finally)');
        }
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      authLog('[AUTH LOAD] onAuthStateChange', event, !!session);
      if (event === 'INITIAL_SESSION') {
        if (mounted && session) {
          await applySession(session);
        } else if (mounted && !session) {
          authLog('[AUTH LOAD] INITIAL_SESSION null');
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          setAuthError(null);
          setIsLoadingAuth(false);
          authLog('[AUTH LOAD 9] setIsLoadingAuth false (INITIAL_SESSION null)');
        }
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (mounted && session) await applySession(session);
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          setAuthError(null);
          setIsLoadingAuth(false);
          authLog('[AUTH LOAD 9] setIsLoadingAuth false (SIGNED_OUT)');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isDev, applySession]);

  // Web: hash con access_token
  useEffect(() => {
    if (isDev) return;
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        const supabase = getSupabase();
        if (supabase) {
          supabase.auth
            .setSession({ access_token, refresh_token })
            .then(() => {
              window.history.replaceState(null, '', window.location.pathname + '#/');
            })
            .catch(console.error);
        }
      }
    }
  }, [isDev]);

  const refreshProfile = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !user?.id) return;
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      setProfile(data ?? {});
    } catch (err) {
      console.error('refreshProfile failed:', err);
    }
  }, [user?.id]);

  const logout = useCallback(async (shouldRedirect = false) => {
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    setIsLoadingAuth(false);
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    await clearSupabaseAuthStorage();
    if (shouldRedirect) {
      window.location.href = window.location.origin + '/';
    }
  }, []);

  const navigateToLogin = useCallback(() => {}, []);

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
      checkAppState: () => {},
      checkUserAuth: () => {},
      refreshProfile,
    }),
    [
      user,
      profile,
      isAuthenticated,
      isLoadingAuth,
      authError,
      logout,
      navigateToLogin,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
