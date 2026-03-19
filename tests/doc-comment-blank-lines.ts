import { RuleTester } from 'eslint';
import { docCommentBlankLines } from '../src/rules/doc-comment-blank-lines';

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2020, sourceType: 'module' }
});

tester.run('doc-comment-blank-lines', docCommentBlankLines, {
  valid: [
    // 1行形式 : 正しい
    {
      name: '1行 : 正しい形式',
      code: '/** 説明 */\nconst x = 1;'
    },
    {
      name: '1行 : タグあり・1行形式',
      code: '/** @deprecated 非推奨 */\nconst x = 1;'
    },
    
    // 複数行 : 2行目空行・タグ前空行あり
    {
      name: '複数行 : 正しい形式 (2行目空行あり)',
      code: [
        '/**',
        ' * 説明',
        ' * ',
        ' * 詳細',
        ' */',
        'const x = 1;'
      ].join('\n')
    },
    {
      name: '複数行 : @param 前に空行あり',
      code: [
        '/**',
        ' * 説明',
        ' * ',
        ' * @param x 値',
        ' */',
        'const fn = (x) => x;'
      ].join('\n')
    },
    {
      name: '複数行 : 複数タグ・空行あり',
      code: [
        '/**',
        ' * 説明',
        ' * ',
        ' * @param x 値',
        ' * @return 結果',
        ' */',
        'const fn = (x) => x;'
      ].join('\n')
    },
    {
      name: '複数行 : 2行目が既に空行',
      code: [
        '/**',
        ' * 1行目',
        ' * ',
        ' * 3行目',
        ' */',
        'const x = 1;'
      ].join('\n')
    },
    
    // 通常ブロックコメントは対象外
    {
      name: '通常ブロックコメント : 対象外',
      code: '/* これは  ではない */\nconst x = 1;'
    },
    {
      name: '単一行コメント : 対象外',
      code: '// 単一行コメント\nconst x = 1;'
    }
  ],
  
  invalid: [
    // 1行化すべきケース
    {
      name: '3行 : 1行化すべき',
      code: [
        '/**',
        ' * 1行で終わってるのに3行使っているので NG',
        ' */',
        'const x = 1;'
      ].join('\n'),
      errors: [{ messageId: 'shouldBeSingleLine' }],
      output: '/** 1行で終わってるのに3行使っているので NG */\nconst x = 1;'
    },
    {
      name: '3行 : 空行含む・1行化すべき',
      code: [
        '/**',
        ' * ',
        ' * 1行のみ',
        ' * ',
        ' */',
        'const x = 1;'
      ].join('\n'),
      errors: [{ messageId: 'shouldBeSingleLine' }],
      output: '/** 1行のみ */\nconst x = 1;'
    },
    
    // 2行目が空行でないケース
    {
      name: '複数行 : 2行目が空行でない',
      code: [
        '/**',
        ' * 1行目',
        ' * 2行目',
        ' */',
        'const x = 1;'
      ].join('\n'),
      errors: [{ messageId: 'missingEmptySecondLine' }],
      output: [
        '/**',
        ' * 1行目',
        ' * ',
        ' * 2行目',
        ' */',
        'const x = 1;'
      ].join('\n')
    },
    {
      name: '複数行 : 2行目が空行でない・3行あり',
      code: [
        '/**',
        ' * 複数行書いているのに',
        ' * この2行目が空行ではないので NG',
        ' * @param x この上に空行がないので NG',
        ' */',
        'const fn = (x) => x;'
      ].join('\n'),
      errors: [{ messageId: 'missingEmptySecondLine' }],
      output: [
        '/**',
        ' * 複数行書いているのに',
        ' * ',
        ' * この2行目が空行ではないので NG',
        ' * ',
        ' * @param x この上に空行がないので NG',
        ' */',
        'const fn = (x) => x;'
      ].join('\n')
    },
    
    // タグブロック前に空行がないケース
    {
      name: '@param 前に空行なし',
      code: [
        '/**',
        ' * 説明',
        ' * ',
        ' * 詳細',
        ' * @param x 値',
        ' */',
        'const fn = (x) => x;'
      ].join('\n'),
      errors: [{ messageId: 'missingEmptyBeforeTagBlock' }],
      output: [
        '/**',
        ' * 説明',
        ' * ',
        ' * 詳細',
        ' * ',
        ' * @param x 値',
        ' */',
        'const fn = (x) => x;'
      ].join('\n')
    },
    {
      name: '@return と @throws が連続 : タグ群の直前のみ空行が必要',
      code: [
        '/**',
        ' * 説明',
        ' * ',
        ' * 詳細',
        ' * @return 結果',
        ' * @throws エラー',
        ' */',
        'const fn = () => 1;'
      ].join('\n'),
      errors: [{ messageId: 'missingEmptyBeforeTagBlock' }],
      output: [
        '/**',
        ' * 説明',
        ' * ',
        ' * 詳細',
        ' * ',
        ' * @return 結果',
        ' * @throws エラー',
        ' */',
        'const fn = () => 1;'
      ].join('\n')
    },
    
    // インデントあり
    {
      name: 'インデントあり・1行化すべき',
      code: '  /**\n   * 説明\n   */\n  const x = 1;',
      errors: [{ messageId: 'shouldBeSingleLine' }],
      output: '  /** 説明 */\n  const x = 1;'
    }
  ]
});

console.log('すべてのテストが通りました！');
