import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.claude', 'public/OneSignalSDKWorker.js']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': [
        'error',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]' },
      ],
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['**/*.test.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['**/mocks.js', '**/PACKAGES.json'],
        },
      ],
    },
  },
  {
    // Harness de smoke E2E (SHG-QA-005): scripts Node, no código de browser.
    files: ['e2e/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
