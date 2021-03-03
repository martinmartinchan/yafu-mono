module.exports = {
  env: {
    mocha: true,
    node: true,
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: [ '.js', '.ts' ],
      },
    },
  },
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  overrides: [ {
    files: [ '*.js', '*.jsx' ],
    extends: [
      'airbnb-base',
      'eslint:recommended',
    ],
    rules: {
      'array-bracket-spacing': [ 'warn', 'always' ],
      'arrow-body-style': 'warn',
      'arrow-parens': [ 'warn', 'always' ],
      'comma-dangle': [ 'warn', 'always-multiline' ],
      'import/named': 'error',
      'import/no-extraneous-dependencies': [
        'warn',
        {
          devDependencies: [
            '**/test*/**',
            '**/build/**',
            '**/rollup.*.js',
            'scripts/**',
          ],
        },
      ],
      'import/prefer-default-export': 'off',
      indent: [
        'warn',
        2,
      ],
      'new-cap': 0,
      'no-multiple-empty-lines': [ 'warn', { max: 1, maxBOF: 0, maxEOF: 0 } ],
      'no-nested-ternary': 'off',
      'no-plusplus': 'off',
      'no-unexpected-multiline': 'error',
      semi: [ 'warn', 'never' ],
      'space-before-function-paren': [ 'warn', 'always' ],
    },
  }, {
    files: [ '*.ts', '*.tsx' ],
    extends: [
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
    ],
    rules: {
      '@typescript-eslint/semi': [ 'warn', 'never' ],
      '@typescript-eslint/no-unused-vars': [ 'warn', {
        args: 'all',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: false,
        vars: 'all',
      } ],
    },
  } ],
}
