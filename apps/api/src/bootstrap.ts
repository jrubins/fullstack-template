import { createDb } from '@app/db';
import { createApp } from './app.ts';
import { loadConfig } from './config.ts';
import { createLogger } from './logger.ts';

/** Wires config, logger, database and app together. Shared by both entry points. */
export function bootstrap() {
  const config = loadConfig();
  const logger = createLogger(config);
  // Serverless functions each hold their own pool, so keep it small there.
  const db = createDb(config.DATABASE_URL, { max: config.VERCEL ? 1 : 10 });
  const app = createApp({ config, db, logger });
  return { app, config, db, logger };
}
