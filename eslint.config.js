import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'src-tauri/target', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // ARCHITEKTUR.md, Stil: keine any ohne Begruendung. Der Kommentarzwang laesst
      // sich nicht erzwingen, das Verbot schon.
      '@typescript-eslint/no-explicit-any': 'error',
      // Keine stillen catch-Bloecke (ARCHITEKTUR.md, Stil).
      'no-empty': ['error', { allowEmptyCatch: false }],
    },
  },
  {
    // Reine Logik darf React nicht kennen (ARCHITEKTUR.md, Architekturregel 1).
    files: ['src/lib/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-*', '@tauri-apps/*'],
              message:
                'src/lib/ ist reine Logik: kein React, kein Tauri, kein DB-Zugriff (ARCHITEKTUR.md, Architekturregel 1).',
            },
          ],
        },
      ],
    },
  },
);
