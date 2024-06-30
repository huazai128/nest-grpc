module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'server/tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  parser: '@typescript-eslint/parser',
  extends: ['@efox/eslint-config-react-prittier-ts', 'plugin:@typescript-eslint/recommended'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-namespace': 'off',
    // 第二个参数传空对象强制覆盖掉@efox内置的prettier规则，不要往对象里加规则，prettier规则全部在.prettier.js里配置
    'prettier/prettier': ['error', {}],
  },
};