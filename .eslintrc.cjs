module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    'prettier',
  ],
  rules: {
    // Désactivé car Nuxt gère les composants multi-mots (AppHeader, etc.)
    'vue/multi-word-component-names': 'off',
    // Nuxt supporte plusieurs racines dans les templates
    'vue/no-multiple-template-root': 'off',
    // Avertissement plutôt qu'erreur pour any
    '@typescript-eslint/no-explicit-any': 'warn',
    // Les auto-imports Nuxt génèrent des variables non déclarées
    'no-undef': 'off',
  },
}
