module.exports = {
  // Type-check TypeScript files
  '**/*.{ts,tsx}': () => 'npm run type-check',

  // Lint and format TypeScript and JavaScript files
  '**/*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],

  // Format other files
  '**/*.{json,md,yml,yaml}': [
    'prettier --write',
  ],
};