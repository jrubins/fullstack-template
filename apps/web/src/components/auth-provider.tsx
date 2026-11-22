import { DevTokenResponseSchema, type DevTokenResponse } from '@app/shared';
import { useQueryClient } from '@tanstack/react-query';
import { AuthKitProvider, useAuth } from '@workos-inc/authkit-react';
import { useMemo, useState, type ReactNode } from 'react';
import { apiRequest } from '@/lib/api';
import { env } from '@/lib/env';
import { SessionContext, setAccessTokenSource, type Session } from '@/lib/session';

/**
 * Provides the session (see lib/session.ts):
 * - WorkOS AuthKit when VITE_WORKOS_CLIENT_ID is set (always, in production);
 * - otherwise, in development only, a test sign-in backed by the API's POST /auth/dev-token.
 *   `import.meta.env.DEV` is false in production builds, so that code is removed from them.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  if (env.workos.clientId) {
    return (
      <AuthKitProvider
        clientId={env.workos.clientId}
        {...(env.workos.apiHostname ? { apiHostname: env.workos.apiHostname } : {})}
        // Drop the ?code=… from the address bar once AuthKit has exchanged it.
        onRedirectCallback={() => window.history.replaceState({}, '', window.location.pathname)}
      >
        <AuthKitSession>{children}</AuthKitSession>
      </AuthKitProvider>
    );
  }
  if (import.meta.env.DEV) return <DevSession>{children}</DevSession>;
  return <p className="p-8">Sign-in is not configured: set VITE_WORKOS_CLIENT_ID.</p>;
}

function AuthKitSession({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const queryClient = useQueryClient();

  const session = useMemo<Session>(() => {
    const user = auth.user;
    return {
      status: auth.isLoading ? 'loading' : user ? 'signed-in' : 'signed-out',
      provider: 'authkit',
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
          }
        : null,
      signIn: () => auth.signIn(),
      signOut: () => {
        queryClient.clear();
        auth.signOut();
      },
      getAccessToken: () => auth.getAccessToken(),
    };
  }, [auth, queryClient]);

  // Set during render so the very first query of a signed-in session already has a token.
  setAccessTokenSource(session.status === 'signed-in' ? session.getAccessToken : undefined);
  return <SessionContext value={session}>{children}</SessionContext>;
}

const DEV_SESSION_KEY = 'app.devSession';

/** A stored dev session, unless missing, malformed or expired. */
function readDevSession(): DevTokenResponse | null {
  const parsed = DevTokenResponseSchema.safeParse(
    JSON.parse(window.localStorage.getItem(DEV_SESSION_KEY) ?? 'null'),
  );
  if (!parsed.success) return null;
  const payload = parsed.data.token.split('.')[1];
  const exp = payload ? (JSON.parse(atob(payload)) as { exp?: number }).exp : undefined;
  return exp && exp * 1000 > Date.now() ? parsed.data : null;
}

function DevSession({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [stored, setStored] = useState(readDevSession);

  const session = useMemo<Session>(
    () => ({
      status: stored ? 'signed-in' : 'signed-out',
      provider: 'dev',
      user: stored ? { id: stored.userId, email: null, name: stored.userId } : null,
      signIn: async (userId) => {
        const next = await apiRequest('/auth/dev-token', DevTokenResponseSchema, {
          method: 'POST',
          body: JSON.stringify({ userId }),
        });
        window.localStorage.setItem(DEV_SESSION_KEY, JSON.stringify(next));
        setStored(next);
      },
      signOut: () => {
        window.localStorage.removeItem(DEV_SESSION_KEY);
        queryClient.clear();
        setStored(null);
      },
      getAccessToken: () =>
        stored ? Promise.resolve(stored.token) : Promise.reject(new Error('Signed out')),
    }),
    [stored, queryClient],
  );

  setAccessTokenSource(stored ? session.getAccessToken : undefined);
  return <SessionContext value={session}>{children}</SessionContext>;
}
