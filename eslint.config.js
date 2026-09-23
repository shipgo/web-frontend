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
    ignores: ['**/*.test.{js,jsx}', 'e2e/**/*.js'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['**/mocks.js', '**/PACKAGES.json'],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.property.name="toISOString"]',
          message: '.toISOString() returns UTC date, risking off-by-one errors in local date logic (SHG-FE-008). Use dayjs().format() for local dates, or explicitly handle UTC conversion.',
        },
      ],
      // Nota: No se agregó regla para toLocaleString/toLocaleDateString/toLocaleTimeString sin 'es-AR'
      // porque es impráctica con no-restricted-syntax (requeriría selector que verifique argumentos
      // específicos y distinguir calls sin argumentos de calls con locale diferente). La cobertura
      // actual de formato argentino en UI (@domain/format → formatFecha/formatFechaHora, Mantine
      // DateInput/DateTimePicker con valueFormat, DatesProvider con locale: 'es') es suficiente
      // y no hay instancias de toLocale*String en código de producción (SHG-FE-082 relevamiento).
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
