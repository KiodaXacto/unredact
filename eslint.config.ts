import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  // Ignore build output and node_modules
  { ignores: ['dist', 'node_modules', 'coverage', 'public'] },

  // TypeScript strict rules
  ...tseslint.configs.recommendedTypeChecked,

  // Project-wide TypeScript parser options
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // React Hooks rules
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // Custom rules enforcing project standards
  {
    rules: {
      // No 'any' types — strict TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // Named exports only (no default exports except pages/configs)
      // We use 'warn' to allow default exports in Vite config, main.tsx
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // Error handling — never swallow errors silently
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',

      // Prefer const
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
);
