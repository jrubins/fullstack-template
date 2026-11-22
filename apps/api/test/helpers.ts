import { randomUUID } from 'node:crypto';
import { createDb } from '@app/db';
import { pino } from 'pino';
import { createApp } from '../src/app.ts';
import { signTestToken } from '../src/auth/tokens.ts';
import { loadConfig } from '../src/config.ts';

/** Secret for test tokens: from the environment (.env / CI), or a fixed fallback. */
export const TEST_SECRET =
  process.env['AUTH_TEST_SECRET'] ?? 'api-test-secret-0123456789abcdefghijklmnop';

/**
 * Builds a real app wired to the test database, with logging silenced and test tokens
 * accepted. Pass env overrides to test configuration-dependent behaviour.
 */
export function createTestApp(overrides: Record<string, string> = {}) {
  const config = loadConfig({
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: process.env['TEST_DATABASE_URL'],
    SENTRY_DSN: '',
    CORS_ORIGINS: 'http://localhost:5173',
    WORKOS_CLIENT_ID: '',
    AUTHKIT_DOMAIN: '',
    ALLOWED_USER_IDS: '',
    MCP_RESOURCE_URL: 'http://localhost:3000/mcp',
    AUTH_TEST_SECRET: TEST_SECRET,
    ...overrides,
  });
  const db = createDb(config.DATABASE_URL, { max: 2 });
  const app = createApp({ config, db, logger: pino({ level: 'silent' }) });
  return { app, db, config };
}

/**
 * A value no other test (or test run) will produce. Tests share one database and run in
 * parallel, so each test creates its own rows with unique values and asserts only on those,
 * never on table counts or on rows it didn't create.
 */
export function unique(label: string): string {
  return `${label} ${randomUUID()}`;
}

/** A fresh user ID: each test can act as its own user, fully isolated from the others. */
export function uniqueUserId(): string {
  return `test-user-${randomUUID()}`;
}

/** `Authorization` header value for a test token. */
export async function bearer(userId: string): Promise<string> {
  return `Bearer ${await signTestToken(TEST_SECRET, userId)}`;
}
