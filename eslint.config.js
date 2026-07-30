import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['coverage/**', 'dist/**', 'node_modules/**', 'release/**'],
  },
  eslint.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-confusing-void-expression': 'error',
    },
  },
);
