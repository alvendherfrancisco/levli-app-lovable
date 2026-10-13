import { requestIOSLogout } from '@/lib/iosSession';
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';
import { clearCachedProfile } from '@/lib/profileCache';

const AuthContext = createContext();

const AUTH_CHECK_TIMEOUT_MS = 5000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

/**
 * The session, in one place.
 *
 * Two rules keep the rest of the app still:
 *
 * 1. The session is reported once per real change. The app settings call, the
 *    session check, a token refresh and the profile fetch can each mention the
 *    session, and every mention used to write state again — a late one flipped
 *    the app back through "loading" and remounted the navigator, dropping
 *    whatever screen the person was on. A report about the account already in
 *    state now changes nothing.
 * 2. There is one session check, and it runs once. A second caller joins the
 *    check already in flight instead of starting another.
 *
 * Nothing here navigates except a sign-out, which is deliberate and happens
 * only after its splash has played.
 */
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

  // The account currently in state, whether the session has resolved at all, and
  // the check in flight (if any).
  const sessionIdRef = useRef(null);
  const authResolvedRef = useRef(false);
  const authCheckRef = useRef(null);

  /**
   * Records a session. Returns true when it was news, false when it repeated
   * what is already in state — in which case nothing is written at all.
   */
  const applySession = useCallback((nextUser) => {
    const nextId = nextUser?.id || null;
    if (authResolvedRef.current && sessionIdRef.current === nextId) return false;

    sessionIdRef.current = nextId;
    authResolvedRef.current = true;
    setUser(nextUser || null);
    setIsAuthenticated(!!nextId);
    setIsLoadingAuth(false);
    setAuthChecked(true);
    // A live session clears any earlier complaint about one.
    if (nextId) setAuthError(null);
    return true;
  }, []);

  const checkUserAuth = useCallback(() => {
    // One check at a time — a second caller waits on the one already running.
    if (authCheckRef.current) return authCheckRef.current;

    const run = (async () => {
      try {
        const currentUser = await withTimeout(base44.auth.me(), AUTH_CHECK_TIMEOUT_MS);
        applySession(currentUser);
      } catch (error) {
        console.error('User auth check failed:', error);
        applySession(null);
        // Token expired/invalid, or the check timed out — send to login
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      } finally {
        setIsLoadingAuth(false);
        setAuthChecked(true);
        authCheckRef.current = null;
      }
    })();

    authCheckRef.current = run;
    return run;
  }, [applySession]);

  const checkAppState = useCallback(async () => {
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
          applySession(null);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);

        // Handle app-level errors
        let error = null;
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            error = { type: 'auth_required', message: 'Authentication required' };
          } else if (reason === 'user_not_registered') {
            error = { type: 'user_not_registered', message: 'User not registered for this app' };
          } else {
            error = { type: reason, message: appError.message };
          }
        } else {
          // Network error, timeout, or unknown failure — don't hang, send to login
          error = { type: 'auth_required', message: appError.message || 'Failed to load app' };
        }
        applySession(null);
        setAuthError(error);
        setIsLoadingPublicSettings(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      applySession(null);
      setAuthError({ type: 'auth_required', message: error.message || 'An unexpected error occurred' });
      setIsLoadingPublicSettings(false);
    }
  }, [applySession, checkUserAuth]);

  useEffect(() => {
    checkAppState();
  }, [checkAppState]);

  const logout = useCallback((shouldRedirect = true, redirectUrl = '/login') => {
    // The cached profile on this device belongs to the account that is leaving.
    clearCachedProfile();
    // Tell the iOS wrapper so it clears its native session too (sets the 3 s guard).
    requestIOSLogout('user');
    sessionIdRef.current = null;
    authResolvedRef.current = true;
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
  }, []);

  /**
   * Leaves for the login screen, through the SDK's own logout endpoint (token
   * cleanup and redirect). The sign-out splash calls this once its sequence has
   * played out.
   */
  const completeLogout = useCallback(() => {
    base44.auth.logout(logoutRedirect || '/login');
  }, [logoutRedirect]);

  /**
   * The one way out to the platform's login endpoint, for the rare case where
   * the session is refused outright. App screens never call it while rendering:
   * a screen that is not signed in is handled by the gate in src/App.jsx with a
   * client-side redirect, so a navigation can never reload the document (and
   * with it, lose the screen the person was on).
   */
  const navigateToLogin = useCallback(() => {
    // Never redirect (or append from_url) when already on a public auth page —
    // prevents /login?from_url=/login?from_url=... stacking
    const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
    if (publicPaths.includes(window.location.pathname)) {
      return;
    }
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(window.location.href);
  }, []);

  // Memoised so a session or settings change is the only thing that re-renders
  // the screens reading this context — the provider re-renders far more often
  // than the session actually changes.
  const value = useMemo(() => ({
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
    checkAppState,
  }), [
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
    checkAppState,
  ]);

  return (
    <AuthContext.Provider value={value}>
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