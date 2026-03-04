import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    const maxRetries = 3;
    const retryDelayMs = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser?.id) {
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, retryDelayMs));
            continue;
          }
          setUser(null);
          setIsAuthenticated(false);
          setAuthError({ type: 'user_not_provisioned', message: 'Usuario no provisionado. Inténtalo de nuevo.' });
          setIsLoadingAuth(false);
          return;
        }
        setUser(currentUser);
        setIsAuthenticated(true);
        setAuthError(null);
        setIsLoadingAuth(false);
        return;
      } catch (error) {
        console.error('User auth check failed (attempt ' + attempt + '):', error);
        const isNotFound = error?.message?.includes('ObjectNotFoundError') || error?.message?.includes('Invalid id value') || error?.status === 404;
        if (attempt < maxRetries && isNotFound) {
          await new Promise((r) => setTimeout(r, retryDelayMs));
          continue;
        }
        setUser(null);
        setIsAuthenticated(false);
        if (error?.status === 401 || error?.status === 403) {
          setAuthError({ type: 'auth_required', message: 'Authentication required' });
        } else if (isNotFound) {
          setAuthError({ type: 'user_not_provisioned', message: 'Usuario no encontrado. Inténtalo de nuevo.' });
        } else {
          setAuthError({ type: 'unknown', message: error?.message || 'Error de autenticación' });
        }
        setIsLoadingAuth(false);
        return;
      }
    }
    setIsLoadingAuth(false);
  }, []);

  const checkAppState = useCallback(async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      // First, check app public settings (with token if available)
      // This will tell us if auth is required, user not registered, etc.
      const appClient = createAxiosClient({
        baseURL: `${appParams.serverUrl}/api/apps/public`,
        headers: {
          'X-App-Id': appParams.appId
        },
        token: appParams.token, // Include token if available
        interceptResponses: true
      });
      
      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);
        
        // If we got the app public settings successfully, check if user is authenticated
        if (appParams.token) {
          base44.auth.setToken(appParams.token);
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);
        
        // Handle app-level errors
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({
              type: 'auth_required',
              message: 'Authentication required'
            });
          } else if (reason === 'user_not_registered') {
            setAuthError({
              type: 'user_not_registered',
              message: 'User not registered for this app'
            });
          } else {
            setAuthError({
              type: reason,
              message: appError.message
            });
          }
        } else {
          setAuthError({
            type: 'unknown',
            message: appError.message || 'Failed to load app'
          });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  }, [checkUserAuth]);

  const logout = useCallback((shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout(window.location.href);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  }, []);

  const navigateToLogin = useCallback(() => {
    if (window.location.hostname === 'localhost') {
      console.log('Login redirect bloqueado en entorno local');
      return;
    }
    // Avoid redirect loop: never redirect if already on /login
    if (window.location.pathname === '/login') return;
    // Avoid nesting from_url inside from_url (causes URI_TOO_LONG)
    const params = new URLSearchParams(window.location.search);
    if (params.has('from_url')) return;
    // Use pathname+search only (not full href) to keep URL short
    const returnTo = window.location.pathname + window.location.search;
    base44.auth.redirectToLogin(returnTo);
  }, []);

  useEffect(() => {
    checkAppState();
  }, [checkAppState]);

  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    appPublicSettings,
    logout,
    navigateToLogin,
    checkAppState,
    checkUserAuth,
  }), [user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, appPublicSettings, logout, navigateToLogin, checkAppState, checkUserAuth]);

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
