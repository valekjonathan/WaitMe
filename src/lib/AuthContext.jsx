import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { Capacitor } from '@capacitor/core';
import { getSupabase, clearSupabaseAuthStorage } from '@/lib/supabaseClient';
import { authTrace, updateAuthDebug } from '@/lib/authTrace';

// DEV AUTO LOGIN
// Only active during local development (npm run dev)
const isDevAutoLogin = () => import.meta.env.DEV;

// DEV kill switch: bypass auth mock (use real Supabase flow)
const isDevBypassAuth = () =>
  import.meta.env.DEV &&
  (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true' || import.meta.env.VITE_BYPASS_AUTH === 'true');

const RENDER_LOG = (msg, extra) => {
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_OAUTH === 'true') {
    try {
      console.log(`[RENDER:AuthContext] ${msg}`, extra ?? '');
    } catch (error) {
      console.error('[WaitMe Error]', error);
    }
  }
};

const OAUTH_LOG = (msg, extra) => {
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_OAUTH === 'true') {
    try {
      console.log(`[Auth] ${msg}`, extra ?? '');
    } catch (error) {
      console.error('[WaitMe Error]', error);
    }
  }
};

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
  RENDER_LOG('AuthProvider ENTER');
  // En DEV: estado inicial ya con usuario mock — sin esperar Supabase (excepto si VITE_DEV_BYPASS_AUTH=true)
  const isDev = isDevAutoLogin() && !isDevBypassAuth();
  const [user, setUser] = useState(() => {
    const init = isDev ? DEV_MOCK_USER : null;
    RENDER_LOG('useState init', { isDev, hasUser: !!init });
    return init;
  });
  const [profile, setProfile] = useState(() => (isDev ? DEV_MOCK_PROFILE : null));
  const [isAuthenticated, setIsAuthenticated] = useState(isDev);
  const [isLoadingAuth, setIsLoadingAuth] = useState(() => {
    const loading = !isDev;
    RENDER_LOG('isLoadingAuth init', loading);
    return loading;
  });
  const [authError, setAuthError] = useState(null);
  const authInFlightRef = useRef(false);

  const ensureUserInDb = useCallback(async (authUser, retryCount = 0) => {
    const supabase = getSupabase();
    if (!supabase || !authUser?.id) return null;
    const email = authUser.email ?? '';
    const fullName = authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? '';
    const avatarUrl = authUser.user_metadata?.avatar_url ?? authUser.user_metadata?.picture ?? '';

    const { data: existing, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (selectError && retryCount < 1) {
      console.log('[AUTH FINAL] ensureUserInDb error, retrying after 500ms', selectError?.message);
      await new Promise((r) => setTimeout(r, 500));
      return ensureUserInDb(authUser, retryCount + 1);
    }
    if (selectError) throw selectError;

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
    OAUTH_LOG('resolveSession start');
    const supabase = getSupabase();
    if (!supabase) {
      OAUTH_LOG('resolveSession: no supabase');
      setIsLoadingAuth(false);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      updateAuthDebug({ authContextUser: false });
      return;
    }
    if (authInFlightRef.current) {
      OAUTH_LOG('resolveSession: authInFlight, skip');
      return;
    }
    authInFlightRef.current = true;
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      // OAuth completado antes de montar: usar sesión ya disponible
      const oauthSession = typeof window !== 'undefined' ? window.__WAITME_OAUTH_SESSION : null;
      if (oauthSession?.user?.id) {
        console.log('[AUTH FINAL] resolveSession: using OAuth session (cold start)');
        const appUser = await ensureUserInDb(oauthSession.user);
        if (appUser?.id) {
          setUser(appUser);
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', oauthSession.user.id)
            .maybeSingle();
          setProfile(profileData ?? {});
          setIsAuthenticated(true);
          updateAuthDebug({ authContextUser: true });
          OAUTH_LOG('resolveSession: user set from OAuth session');
          return;
        }
      }
      const { data: sessionData } = await supabase.auth.getSession();
      authTrace(
        7,
        'AuthContext.jsx',
        'resolveSession',
        'getSession restored',
        !!sessionData?.session,
        sessionData?.session?.user?.email
      );
      authTrace(
        11,
        'AuthContext.jsx',
        'resolveSession',
        'persisted storage check',
        !!sessionData?.session
      );
      updateAuthDebug({ sessionExists: !!sessionData?.session });
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser?.id) {
        OAUTH_LOG('resolveSession: no user');
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        updateAuthDebug({ authContextUser: false });
        return;
      }
      OAUTH_LOG('resolveSession: user found', authUser.email);
      const appUser = await ensureUserInDb(authUser);
      if (!appUser?.id) {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        return;
      }
      setUser(appUser);
      updateAuthDebug({ authContextUser: true });

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileError) {
        console.error('PROFILE LOAD ERROR:', profileError);
      }
      if (profileData) {
        setProfile(profileData);
      } else {
        setProfile({});
      }
      setIsAuthenticated(true);
      OAUTH_LOG('resolveSession: session created');
    } catch (error) {
      OAUTH_LOG('resolveSession failed:', error?.message);
      console.error('Auth resolve failed:', error);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      const errMsg = error?.message || 'Error de autenticación';
      setAuthError({ type: 'unknown', message: errMsg });
      updateAuthDebug({ authContextUser: false, lastAuthError: errMsg });
    } finally {
      setIsLoadingAuth(false);
      authInFlightRef.current = false;
    }
  }, [ensureUserInDb]);

  useEffect(() => {
    // DEV AUTO LOGIN — Solo saltar Supabase cuando usamos mock (no bypass)
    // Con VITE_DEV_BYPASS_AUTH=true necesitamos el flujo real para login Google en Simulator
    if (isDevAutoLogin() && !isDevBypassAuth()) {
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setIsLoadingAuth(false);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      authTrace(8, 'AuthContext.jsx', 'onAuthStateChange', 'event', event);
      updateAuthDebug({ lastAuthStateEvent: event });
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
            if (import.meta.env.VITE_DEBUG_OAUTH === 'true') {
              console.log('[Auth] usuario autenticado:', appUser.email, 'id:', appUser.id);
            }
            setUser(appUser);
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            if (profileError) console.error('PROFILE LOAD ERROR:', profileError);
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
        supabase.auth
          .setSession({ access_token, refresh_token })
          .then(() => {
            window.history.replaceState(null, '', window.location.pathname + '#/');
          })
          .catch((error) => {
            console.error('[WaitMe Error]', error);
          })
          .finally(() => resolveSession());
        return () => subscription.unsubscribe();
      }
    }

    resolveSession();

    return () => subscription.unsubscribe();
  }, [resolveSession, ensureUserInDb]);

  const checkUserAuth = useCallback(
    async (overrideSession = null) => {
      const session = overrideSession ?? window.__WAITME_OAUTH_SESSION ?? null;
      if (session?.user?.id) {
        console.log('[AUTH FINAL] checkUserAuth with session, user:', session.user.id);
        authInFlightRef.current = true;
        setIsLoadingAuth(true);
        try {
          // Pequeña espera para que headers Supabase estén actualizados (workaround iOS #1566)
          await new Promise((r) => setTimeout(r, 100));
          const appUser = await ensureUserInDb(session.user);
          if (appUser?.id) {
            setUser(appUser);
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
            console.log('[AUTH FINAL] user set true');
            updateAuthDebug({ authContextUser: true });
          } else {
            console.log('[AUTH FINAL] user set false (ensureUserInDb returned null)');
          }
        } catch (err) {
          console.error('[AUTH FINAL] checkUserAuth failed:', err);
        } finally {
          setIsLoadingAuth(false);
          authInFlightRef.current = false;
        }
        return;
      }
      await resolveSession();
    },
    [resolveSession, ensureUserInDb]
  );

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
    [
      user,
      profile,
      isAuthenticated,
      isLoadingAuth,
      authError,
      logout,
      navigateToLogin,
      checkUserAuth,
      refreshProfile,
    ]
  );

  RENDER_LOG('AuthProvider RENDER', { user: !!user?.id, isLoadingAuth, isAuthenticated });
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
