import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext();

const AUTH_CHECK_TIMEOUT_MS = 5000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutRedirect, setLogoutRedirect] = useState('/login');
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      // First, check app public settings (with token if available)
      // This will tell us if auth is required, user not registered, etc.
      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: {
          'X-App-Id': appParams.appId
        },
        token: appParams.token, // Include token if available
        interceptResponses: true
      });
      
      try {
        const publicSettings = await withTimeout(
          appClient.get(`/prod/public-settings/by-id/${appParams.appId}`),
          AUTH_CHECK_TIMEOUT_MS
        );
        setAppPublicSettings(publicSettings);
        
        // If we got the app public settings successfully, check if user is authenticated
        if (appParams.token) {
          setIsNewUser(false);
          await checkUserAuth();
        } else {
          // No stored token → brand-new user. Show onboarding (with sign-up).
          setIsNewUser(true);
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
          setAuthChecked(true);
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
          // Network error, timeout, or unknown failure — don't hang, send to login
          setAuthError({
            type: 'auth_required',
            message: appError.message || 'Failed to load app'
          });
        }
        setAuthChecked(true);
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'auth_required',
        message: error.message || 'An unexpected error occurred'
      });
      setAuthChecked(true);
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const currentUser = await withTimeout(base44.auth.me(), AUTH_CHECK_TIMEOUT_MS);
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);

      // Token expired/invalid, or the check timed out — send to login instead of hanging
      setAuthError({
        type: 'auth_required',
        message: 'Authentication required'
      });
    }
  };

  const logout = (shouldRedirect = true, redirectUrl = '/login') => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      // The sign-out plays the launch splash over the teardown first, and only
      // then leaves (see completeLogout). Leaving straight away would paint the
      // splash frozen: a page that is already navigating away does not animate
      // a screen mounted into it.
      setLogoutRedirect(redirectUrl || '/login');
      setIsLoggingOut(true);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  };

  /**
   * Leaves for the login screen, through the SDK's own logout endpoint (token
   * cleanup and redirect). The sign-out splash calls this once its sequence has
   * played out.
   */
  const completeLogout = () => {
    base44.auth.logout(logoutRedirect || '/login');
  };

  const navigateToLogin = () => {
    // Never redirect (or append from_url) when already on a public auth page —
    // prevents /login?from_url=/login?from_url=... stacking
    const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
    if (publicPaths.includes(window.location.pathname)) {
      return;
    }
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      isNewUser,
      isLoggingOut,
      logout,
      completeLogout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
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