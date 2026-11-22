// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
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
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },

  // Plain JS config files: no type information.
  {
    files: ['**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },

  { files: ['apps/api/**', 'packages/**'], languageOptions: { globals: globals.node } },

  {
    files: ['apps/web/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat['recommended-latest'], reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
  },
  {
    // Route files export `Route` objects; shadcn files export variants next to components.
    files: ['apps/web/src/routes/**', 'apps/web/src/components/ui/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },

  storybook.configs['flat/recommended'],

  // Must stay last: turns off rules that conflict with Prettier.
  prettier,
]);
