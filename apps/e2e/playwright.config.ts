import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run the real API and web app against the test database (TEST_DATABASE_URL).
// They use their own ports, so they can run while `pnpm dev` is running.
const API_PORT = 3100;
const WEB_PORT = 5174;
export const API_URL = `http://localhost:${API_PORT}`;

const testDatabaseUrl = process.env['TEST_DATABASE_URL'];
if (!testDatabaseUrl) throw new Error('TEST_DATABASE_URL is not set (see .env.example)');

const isCI = Boolean(process.env['CI']);

export default defineConfig({
  testDir: './tests',
  // Tests share one database and run in parallel: each creates its own uniquely named data.
  fullyParallel: true,
  forbidOnly: isCI,
  retries: 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    // Traces are expensive to record; rerun a failing test with `--trace on` to debug it.
    trace: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      name: 'api',
      // Migrate the test database, then start the API on it.
      command: 'pnpm --filter @app/db migrate --yes && pnpm --filter @app/api start',
      url: `${API_URL}/health`,
      env: {
        NODE_ENV: 'test',
        DATABASE_URL: testDatabaseUrl,
        PORT: String(API_PORT),
        CORS_ORIGINS: `http://localhost:${WEB_PORT}`,
        SENTRY_DSN: '',
        LOG_LEVEL: 'warn',
      },
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
    {
      name: 'web',
      command: `pnpm --filter @app/web exec vite --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { VITE_API_URL: API_URL, VITE_SENTRY_DSN: '' },
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
  ],
});
