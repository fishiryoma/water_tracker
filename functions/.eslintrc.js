module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'google',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json', 'tsconfig.dev.json'],
    sourceType: 'module',
  },
  ignorePatterns: [
    '/lib/**/*', // Ignore built files.
    '/generated/**/*', // Ignore generated files.
  ],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    'import/no-unresolved': 0,
    indent: 'off',
    'no-console': 'off',
    'no-unused-vars': 'warn',
    'require-jsdoc': 'off',
    'valid-jsdoc': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-inferrable-types': 'off',
  },
}
