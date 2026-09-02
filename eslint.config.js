import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Guardrails against God components/files creeping back in. Warnings,
      // not errors — the codebase has existing violations being paid down in
      // phases, and these should be visible in `npm run lint` output without
      // blocking the build until that paydown is done.
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 120, skipBlankLines: true, skipComments: true }],
      complexity: ['warn', 15],
    },
  },
  {
    // Vendored shadcn/ui primitives. Each pairs a component with a sibling
    // `cva` variants export (badgeVariants, buttonVariants, ...) by upstream
    // convention — splitting that out to satisfy fast-refresh would fight
    // `npx shadcn add`'s regeneration format on every future update.
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
