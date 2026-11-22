import * as Sentry from '@sentry/react';
import { useEffect, type ReactNode } from 'react';
import { useSession } from '@/lib/session';
import { SignInScreen } from './sign-in-screen';

/**
 * Renders the app only for a signed-in user; otherwise the sign-in screen. The router (and so
 * every route loader and query) mounts inside this gate, so API calls always carry a token.
 */
export function SessionGate({ children }: { children: ReactNode }) {
  const session = useSession();
  const { status, user, provider, signIn } = session;

  // WorkOS sends users to /login to start sign-in (the app's "Initiate login URI").
  useEffect(() => {
    if (
      status === 'signed-out' &&
      provider === 'authkit' &&
      window.location.pathname === '/login'
    ) {
      void signIn();
    }
  }, [status, provider, signIn]);

  // Errors and traces carry the user ID only (no email; see dataCollection in lib/sentry.ts).
  useEffect(() => {
    Sentry.setUser(user ? { id: user.id } : null);
  }, [user]);

  if (status === 'loading') {
    return <p className="text-muted-foreground p-8 text-sm">Loading…</p>;
  }
  if (status === 'signed-out') return <SignInScreen provider={provider} onSignIn={signIn} />;
  return children;
}
