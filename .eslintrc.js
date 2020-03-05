module.exports = {
  extends: ['standard'],
  plugins: ['standard', 'react'],
  globals: {
    fetch: true,
    localStorage: true,
  },
  rules: {
    'no-var': 'error',
    'no-unused-vars': 1,
    'arrow-spacing': ['error', {
      before: true,
      after: true
    }],
    indent: ['error', 2],
    'comma-dangle': [
      'error',
      {
        objects: 'only-multiline',
        arrays: 'only-multiline',
        imports: 'never',
        exports: 'never',
        functions: 'never',
      },
    ],
    semi: ['error', 'never'],
    'max-len': 'off',
    'template-curly-spacing': ['error', 'always'],
    'arrow-parens': ['error', 'as-needed'],
    'space-before-function-paren': [
      'error',
      {
        named: 'always',
        anonymous: 'always',
        asyncArrow: 'always',
      },
    ],
    'standard/object-curly-even-spacing': ['error', 'either'],
    'standard/array-bracket-even-spacing': ['error', 'either'],
    'standard/computed-property-even-spacing': ['error', 'even'],
    'standard/no-callback-literal': ['error', ['cb', 'callback']],
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
  },
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      modules: true,
      experimentalObjectRestSpread: true,
    }
  },
}
