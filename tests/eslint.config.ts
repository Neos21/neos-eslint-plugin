import neosEslintPlugin from '../dist/index';

// テスト用の ESLint ファイル
export default [
  {
    files: ['tests/test-file.ts'],
    plugins: {
      'neos-eslint-plugin': neosEslintPlugin.rules
    },
    rules: {
      'neos-eslint-plugin/doc-comment-format': 'error',
      'neos-eslint-plugin/blank-line-indent': 'warn',
      'neos-eslint-plugin/newline-before-statement': 'warn',
      'neos-eslint-plugin/no-space-before-paren': 'warn'
    }
  },
  
  //{ files: ['tests/test-file.ts'] },
  //neosEslintPlugin.configs.recommended
];
