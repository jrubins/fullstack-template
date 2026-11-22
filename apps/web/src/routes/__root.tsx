import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';

export interface RouterContext {
  queryClient: QueryClient;
}

// Devtools are loaded only in development and never shipped in production bundles.
const Devtools = import.meta.env.DEV ? lazy(() => import('@/components/devtools')) : () => null;

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => <p className="text-muted-foreground">Page not found.</p>,
  errorComponent: ({ error, reset }) => (
    <div className="space-y-3">
      <p className="font-medium">Something went wrong.</p>
      <p className="text-muted-foreground text-sm">
        {error instanceof Error ? error.message : String(error)}
      </p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  ),
});

function RootLayout() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <header className="mb-8 flex items-center gap-6">
        <span className="font-semibold">App</span>
        <nav className="flex gap-4 text-sm">
          <Link to="/" className="text-muted-foreground [&.active]:text-foreground">
            Home
          </Link>
          <Link to="/items" className="text-muted-foreground [&.active]:text-foreground">
            Items
          </Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <Suspense>
        <Devtools />
      </Suspense>
    </div>
  );
}
