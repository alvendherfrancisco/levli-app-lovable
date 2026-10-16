import { lazy, Suspense, useEffect } from 'react';
import ToastHost from "@/components/ToastHost";
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import ReportErrorBoundary from '@/components/report/ReportErrorBoundary';
import SplashGate from '@/components/splash/SplashGate';
import { perfMark, useMountProbe } from '@/lib/perfProbe';
import WrapperOnly from '@/components/ios/WrapperOnly';
import IOSNavigationBridge from '@/components/ios/IOSNavigationBridge';
import IOSLifecycleEvents from '@/components/ios/IOSLifecycleEvents';
import ShotReminderSync from '@/components/ios/ShotReminderSync';
import AppReviewModal from '@/components/ios/AppReviewModal';

import { AppStateProvider, useAppState } from '@/lib/AppState';
import { SubscriptionProvider } from '@/lib/SubscriptionContext';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// App pages
import Onboarding from '@/pages/Onboarding';
import Home from '@/pages/Home';
import Shots from '@/pages/Shots';
import History from '@/pages/History';
import Journal from '@/pages/Journal';
import More from '@/pages/More';
import Profile from '@/pages/Profile';
import SettingsPage from '@/pages/SettingsPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import TermsPage from '@/pages/TermsPage';
import MedicalDisclaimerPage from '@/pages/MedicalDisclaimerPage';
import AboutSourcesPage from '@/pages/AboutSourcesPage';
import MyMedications from '@/pages/MyMedications';
import BackupRestorePage from '@/pages/BackupRestorePage';
import CaregiverAccessPage from '@/pages/CaregiverAccessPage';
import HelpFeedbackPage from '@/pages/HelpFeedbackPage';

// Layout
import AppLayout from '@/components/AppLayout';

// The two heaviest and least opened screens. Insights pulls in the chart
// library; the report pulls in the PDF engine and html2canvas. Loading them on
// their own keeps all of that off the app's first screen.
const Insights = lazy(() => import('@/pages/Insights'));
const ReportPage = lazy(() => import('@/pages/ReportPage'));

function HomeOrOnboarding() {
  const { onboardingCompleted } = useAppState();
  // null = still loading profile; show spinner until we know
  if (onboardingCompleted === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }
  return onboardingCompleted ? <Home /> : <Navigate to="/onboarding" replace />;
}

// Unauthenticated entry: new users (no stored token) go to onboarding;
// returning users (expired/invalid token or ambiguous check) go to login.
function EntryRedirect() {
  const { isNewUser } = useAuth();
  return <Navigate to={isNewUser ? "/onboarding" : "/login"} replace />;
}

// Shown only while a lazily-loaded screen fetches its own code.
const RouteLoading = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

/**
 * One navigation tree for the whole session.
 *
 * It mounts once and is never swapped for a spinner, so nothing can unmount it
 * and drop the screen in hand — not an auth event, not a settings call, not a
 * profile fetch. While the app starts, the launch splash covers everything; the
 * gate inside the tree looks after the signed-in screens.
 *
 * Nothing on this path navigates. A missing or expired session is handled by
 * the gate with a client-side redirect; leaving the document is what reloads
 * the app and lands it back on Home.
 */
const AuthenticatedApp = () => {
  useEffect(() => {
    perfMark("navigator mounted (splash finished)");
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={<Onboarding />} />
      {/* Legal pages are public: store reviewers and anyone following a link
          must be able to read them without signing in. */}
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/medical-disclaimer" element={<MedicalDisclaimerPage />} />
      <Route path="/about-sources" element={<AboutSourcesPage />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<EntryRedirect />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomeOrOnboarding />} />
          <Route path="/shots" element={<Shots />} />
          <Route path="/medications" element={<MyMedications />} />
          <Route path="/history" element={<History />} />
          {/* Each lazy screen waits on its own, inside the shell: the tab bar
              and the current screen around it stay mounted while it loads. */}
          <Route path="/insights" element={<Suspense fallback={<RouteLoading />}><Insights /></Suspense>} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/more" element={<More />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/backup-restore" element={<BackupRestorePage />} />
        <Route path="/caregiver-access" element={<CaregiverAccessPage />} />
        <Route path="/help-feedback" element={<HelpFeedbackPage />} />
        {/* The old developer push test screen is gone; send its link to Settings. */}
        <Route path="/push-test" element={<Navigate to="/settings" replace />} />
        <Route path="/report" element={<ReportErrorBoundary><Suspense fallback={<RouteLoading />}><ReportPage /></Suspense></ReportErrorBoundary>} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  // Startup timing and mount counts — silent unless the probe is switched on
  // with ?perf=1 (see src/lib/perfProbe.js).
  useEffect(() => {
    perfMark("app first render");
  }, []);
  useMountProbe("app tree");

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <AppStateProvider>
          <SubscriptionProvider>
          <Router>
            <ScrollToTop />
            {/* The launch splash sits over the app while it starts up, then
                cross-fades into whatever screen the app opens on. */}
            <IOSNavigationBridge />
            <IOSLifecycleEvents />
            <ShotReminderSync />
            <WrapperOnly>
              <SplashGate>
                <AuthenticatedApp />
              </SplashGate>
            </WrapperOnly>
          </Router>
          <ToastHost />
          <AppReviewModal />
          </SubscriptionProvider>
        </AppStateProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App