import { Router } from 'express';
import type { Db } from '@app/db';
import type { Health } from '@app/shared';

export function healthRouter(db: Db, version: string): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const databaseUp = await db.ping();
    const body: Health = {
      status: databaseUp ? 'ok' : 'degraded',
      database: databaseUp ? 'up' : 'down',
      version,
      time: new Date().toISOString(),
    };
    res.status(databaseUp ? 200 : 503).json(body);
  });

  return router;
}
