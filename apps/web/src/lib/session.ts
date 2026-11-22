import { createContext, useContext } from 'react';

export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
}

/**
 * The signed-in session, whichever provider backs it: WorkOS AuthKit, or in development the
 * test sign-in (see components/auth-provider.tsx). Components only ever use this interface.
 */
export interface Session {
  status: 'loading' | 'signed-out' | 'signed-in';
  user: SessionUser | null;
  /** 'authkit' redirects to WorkOS; 'dev' signs in as `userId` via POST /auth/dev-token. */
  provider: 'authkit' | 'dev';
  signIn: (userId?: string) => Promise<void>;
  signOut: () => void;
  getAccessToken: () => Promise<string>;
}

export const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside <AuthProvider>');
  return session;
}

let tokenSource: (() => Promise<string>) | undefined;

/** Called by the auth provider so `apiRequest` can authenticate every API call. */
export function setAccessTokenSource(source: (() => Promise<string>) | undefined) {
  tokenSource = source;
}

/** The current access token, or undefined when signed out. */
export async function currentAccessToken(): Promise<string | undefined> {
  return tokenSource?.();
}
