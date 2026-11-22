import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import type { Linter } from 'eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    '**/dist',
    '**/coverage',
    '**/storybook-static',
    '**/.vercel',
    '**/routeTree.gen.ts',
    'packages/db/migrations',
    'packages/db/src/contract.d.ts',
  ]),

  // Type-aware rules for all TypeScript (uses the `typescript` 6 package; see README).
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },

  {
    files: ['apps/api/**', 'packages/**', 'eslint.config.ts'],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['apps/web/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat['recommended-latest'], reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
    rules: {
      // Fast Refresh keeps component state only for files that export just components.
      // Allowed exceptions: TanStack Router's `Route` (its Vite plugin splits the component
      // out) and shadcn's style variants exported next to their component.
      'react-refresh/only-export-components': [
        'error',
        { allowExportNames: ['Route', 'buttonVariants', 'badgeVariants'] },
      ],
    },
  },

  // eslint-plugin-storybook 10.6 types its rules against older ESLint typings than ESLint 10's;
  // the config itself is valid at runtime.
  storybook.configs['flat/recommended'] as unknown as Linter.Config[],

  // Must stay last: turns off rules that conflict with Prettier.
  prettier,
]);
