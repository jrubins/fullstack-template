import { fileURLToPath, URL } from 'node:url';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Source maps are uploaded to Sentry only when SENTRY_AUTH_TOKEN is set (e.g. in Vercel's
// build environment), then deleted so they are never served publicly.
const sentryAuthToken = process.env['SENTRY_AUTH_TOKEN'];

export default defineConfig({
  plugins: [
    // Must come before react(): generates src/routeTree.gen.ts from src/routes.
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    sentryAuthToken
      ? sentryVitePlugin({
          authToken: sentryAuthToken,
          org: process.env['SENTRY_ORG'],
          project: process.env['SENTRY_PROJECT'],
          sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
          telemetry: false,
        })
      : null,
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    sourcemap: sentryAuthToken ? 'hidden' : false,
    rolldownOptions: {
      output: {
        // Long-lived vendor chunks: they stay cached across app deploys.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'sentry', test: /node_modules[\\/]@sentry(-internal)?[\\/]/ },
            { name: 'tanstack', test: /node_modules[\\/]@tanstack[\\/](?!charts)/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
