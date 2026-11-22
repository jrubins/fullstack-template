import { Router } from 'express';
import { DevTokenRequestSchema, type DevTokenResponse } from '@app/shared';
import { signTestToken } from '../../auth/tokens.ts';
import { validate } from '../../lib/validate.ts';

/**
 * Development and test sign-in: issues a short-lived test token for any user ID, so the web
 * app and end-to-end tests work without a WorkOS account. Only mounted when AUTH_TEST_SECRET
 * is configured, which config refuses in production.
 */
export function devAuthRouter(testSecret: string): Router {
  const router = Router();

  router.post('/dev-token', async (req, res) => {
    const { userId } = validate(DevTokenRequestSchema, req.body ?? {});
    const body: DevTokenResponse = { token: await signTestToken(testSecret, userId), userId };
    res.json(body);
  });

  return router;
}
