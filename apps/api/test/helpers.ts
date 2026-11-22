import { randomUUID } from 'node:crypto';
import { createDb } from '@app/db';
import { pino } from 'pino';
import { createApp } from '../src/app.ts';
import { loadConfig } from '../src/config.ts';

/** Builds a real app wired to the test database, with logging silenced. */
export function createTestApp() {
  const config = loadConfig({
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: process.env['TEST_DATABASE_URL'],
    SENTRY_DSN: '',
    CORS_ORIGINS: 'http://localhost:5173',
  });
  const db = createDb(config.DATABASE_URL, { max: 2 });
  const app = createApp({ config, db, logger: pino({ level: 'silent' }) });
  return { app, db };
}

/**
 * A value no other test (or test run) will produce. Tests share one database and run in
 * parallel, so each test creates its own rows with unique values and asserts only on those,
 * never on table counts or on rows it didn't create.
 */
export function unique(label: string): string {
  return `${label} ${randomUUID()}`;
}
