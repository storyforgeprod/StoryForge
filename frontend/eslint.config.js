import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Feature isolation — enforce public-API rule once features/ exists.
      // Raised to 'error' in Phase 7 of the migration plan.
      'import/no-restricted-paths': [
        'warn',
        {
          zones: [
            {
              target: './src',
              from: './src/features/*/!(index.ts)/**/*',
              message:
                'Import features only via their root barrel (@/features/<name>), not internal paths.',
            },
          ],
        },
      ],
    },
  },
);
