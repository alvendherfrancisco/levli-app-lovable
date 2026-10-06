import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

/**
 * Gates the signed-in screens.
 *
 * Order matters here, and it is the whole point of the gate:
 *
 * 1. Someone who is signed in is rendered through, first, and that decision
 *    never depends on a loading flag. Once the screens are on, nothing can take
 *    them away again — an auth event, a token refresh or a second settings call
 *    used to flip the app back through a fallback, which unmounted the screen in
 *    hand and mounted it again (a "reload" that dropped people back on Home).
 * 2. Before the session has resolved, the fallback covers the wait.
 * 3. Someone who is not signed in goes where the app says, and only here:
 *    a client-side redirect to login or onboarding. Nothing on this path leaves
 *    the document.
 *
 * There is no session check here: the provider runs exactly one at launch, and
 * a second one from inside the tree is what made the session resolve twice.
 */
export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement }) {
  const { isAuthenticated, authChecked, authError } = useAuth();

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  if (isAuthenticated) {
    return <Outlet />;
  }

  if (!authChecked) {
    return fallback;
  }

  return unauthenticatedElement;
}