import { z } from 'zod';

/**
 * POST /auth/dev-token: development and test sign-in without WorkOS. The API only offers it
 * when AUTH_TEST_SECRET is set, which it refuses in production.
 */
export const DevTokenRequestSchema = z.object({
  userId: z
    .string()
    .trim()
    .regex(/^[\w-]{1,64}$/, 'Letters, digits, "_" and "-" only')
    .default('dev-user'),
});
export type DevTokenRequest = z.input<typeof DevTokenRequestSchema>;

export const DevTokenResponseSchema = z.object({
  token: z.string(),
  userId: z.string(),
});
export type DevTokenResponse = z.infer<typeof DevTokenResponseSchema>;
