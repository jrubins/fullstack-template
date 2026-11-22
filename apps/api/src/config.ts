import { z } from 'zod';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.url(),
  /** Comma-separated list of browser origins allowed to call the API. */
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  SENTRY_DSN: z.preprocess(emptyToUndefined, z.url().optional()),
  SENTRY_ENVIRONMENT: z.preprocess(emptyToUndefined, z.string().optional()),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
  /** Set automatically on Vercel. */
  VERCEL: z.preprocess(emptyToUndefined, z.string().optional()),
  /** Set automatically on Vercel; used as the Sentry release and reported by /health. */
  VERCEL_GIT_COMMIT_SHA: z.preprocess(emptyToUndefined, z.string().optional()),
});

export type Config = z.infer<typeof EnvSchema>;

/** Parses and validates environment variables. Throws a readable error listing every problem. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = EnvSchema.safeParse(env);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
