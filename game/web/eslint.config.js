import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Playwright: Node-код; `use` в фикстурах — не React-хук; `player` в аргументах теста — фикстура ради побочного эффекта.
    files: ['e2e/**/*.js', 'playwright.config.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'no-unused-vars': ['error', { args: 'none' }],
    },
  },
  {
    // Quarantine: screens must not import legacy tab containers / section components.
    files: ['src/screens/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '**/components/**/*Premium*',
            '**/components/**/*Section*',
          ],
        },
      ],
    },
  },
])
