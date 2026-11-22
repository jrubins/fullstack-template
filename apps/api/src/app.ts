import * as Sentry from '@sentry/node';
import { waitUntil } from '@vercel/functions';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { Logger } from 'pino';
import type { Db } from '@app/db';
import type { Config } from './config.ts';
import { createItemsService } from './features/items/items.service.ts';
import { itemsRouter } from './features/items/items.routes.ts';
import { errorHandler, notFoundHandler } from './middleware/error-handler.ts';
import { healthRouter } from './routes/health.ts';

export interface AppDeps {
  config: Config;
  db: Db;
  logger: Logger;
}

/** Builds the Express app from its dependencies. No side effects, so tests can create one freely. */
export function createApp({ config, db, logger }: AppDeps): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', true);
  app.use(helmet());
  app.use(cors({ origin: config.CORS_ORIGINS }));
  app.use(express.json({ limit: '100kb' }));
  app.use(pinoHttp({ logger }));

  // On Vercel, keep the function alive until Sentry has sent this request's events.
  if (config.VERCEL && config.SENTRY_DSN) {
    app.use((_req, res, next) => {
      res.on('finish', () => waitUntil(Sentry.flush(2000)));
      next();
    });
  }

  app.use('/health', healthRouter(db, config.VERCEL_GIT_COMMIT_SHA ?? 'dev'));
  app.use('/items', itemsRouter(createItemsService(db)));

  app.use(notFoundHandler);
  // Reports 5xx errors to Sentry (no-op while Sentry is disabled), then our JSON error handler.
  Sentry.setupExpressErrorHandler(app);
  app.use(errorHandler);

  return app;
}
