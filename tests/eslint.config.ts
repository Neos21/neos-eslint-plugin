import neosEslintPlugin from '../dist/index.mjs';

// テスト用の ESLint ファイル
export default [
  { files: ['tests/**/*.ts'] },
  neosEslintPlugin.configs.recommended
  
  //neosEslintPlugin.configs.warn
  
  //{
  //  plugins: {
  //    'neos-eslint-plugin': neosEslintPlugin
  //  },
  //  rules: {
  //    'neos-eslint-plugin/doc-comment-format'      : 'error',
  //    'neos-eslint-plugin/blank-line-indent'       : 'error',
  //    'neos-eslint-plugin/newline-before-statement': 'error',
  //    'neos-eslint-plugin/no-space-before-paren'   : 'error'
  //  }
  //}
];
