// Vercel Function entry point: Vercel runs the default-exported Express app for every request
// (vercel.json rewrites all paths here). Sentry first, then the app via dynamic import so Sentry
// can instrument express, pg and http before they load.
await import('../src/instrument.ts');
const { bootstrap } = await import('../src/bootstrap.ts');

export default bootstrap().app;
