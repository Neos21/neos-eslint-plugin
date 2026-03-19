import { RuleTester } from 'eslint';

import { commentParenSpacingRule } from '../src/rules/comment-paren-spacing';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  }
});

/* eslint-disable */
tester.run('comment-paren-spacing', commentParenSpacingRule, {
  valid: [
    // 半角カッコ : 既に正しい形式
    {
      name: '単一行コメント : 半角カッコ・スペースあり',
      code: '// 説明 (補足) テキスト'
    },
    {
      name: '単一行コメント : 全角カッコなし',
      code: '// 普通のコメント'
    },
    {
      name: '複数行コメント : 半角カッコ',
      code: '/* 説明 (補足) テキスト */'
    },
    {
      name: 'ドキュメンテーションコメント : 半角カッコ',
      code: '/** @param x (数値) 説明 */'
    },
    {
      name: '文字列 : 半角カッコ',
      code: 'const s = "説明 (補足) テキスト";'
    },
    {
      name: 'テンプレートリテラル: 半角カッコ',
      code: 'const s = `説明 (補足) テキスト`;'
    },
    
    // checkStrings : false
    {
      name: 'checkStrings=false : 文字列内の全角カッコは無視',
      code: 'const s = "説明（補足）テキスト";',
      options: [{ checkStrings: false }]
    },
    {
      name: 'checkStrings=false : テンプレートリテラル内も無視',
      code: 'const s = `説明（補足）テキスト`;',
      options: [{ checkStrings: false }]
    }
  ],
  
  invalid: [
    // 単一行コメント
    {
      name: '単一行コメント : 全角カッコ・前後に文字あり',
      code: '// 説明（補足）テキスト',
      errors: [{ messageId: 'noFullWidthParen' }],
      output: '// 説明 (補足) テキスト'
    },
    {
      name: '単一行コメント : 開き全角カッコのみ前後スペースなし',
      code: '// 説明（補足) テキスト',
      errors: [{ messageId: 'noFullWidthParen' }],
      output: '// 説明 (補足) テキスト'
    },
    {
      name: '単一行コメント : 閉じ全角カッコのみ',
      code: '// 説明(補足）テキスト',
      errors: [{ messageId: 'noFullWidthParen' }],
      output: '// 説明(補足) テキスト'
    },
    {
      name: '単一行コメント : 前にスペースが既にある場合は追加しない',
      code: '// 説明 （補足）テキスト',
      errors: [{ messageId: 'noFullWidthParen' }],
      output: '// 説明 (補足) テキスト'
    },
    {
      name: '単一行コメント : 後ろにスペースが既にある場合は追加しない',
      code: '// 説明（補足） テキスト',
      errors: [{ messageId: 'noFullWidthParen' }],
      output: '// 説明 (補足) テキスト'
    },
    {
      name: '単一行コメント : 行末の全角カッコ（末尾スペースなし）',
      code: '// 説明（補足）',
      errors: [{ messageId: 'noFullWidthParen' }],
      output: '// 説明 (補足)'
    },
    {
      name: '単一行コメント : 複数の全角カッコ',
      code: '// 説明（補足A）と（補足B）',
      errors: [{ messageId: 'noFullWidthParen' }],
      output: '// 説明 (補足A) と (補足B)'
    },
    
    // 複数行コメント
    {
      name: '複数行コメント : 全角カッコ',
      code: '/* 説明（補足）テキスト */',
      errors: [{ messageId: 'noFullWidthParen' }],
      output: '/* 説明 (補足) テキスト */'
    },
    
    // ドキュメンテーションコメント
    {
      name: 'ドキュメンテーションコメント : 全角カッコ',
      code: '/** @param x （数値） 説明 */',
      errors: [{ messageId: 'noFullWidthParen' }],
      output: '/** @param x (数値) 説明 */'
    },
    
    // 文字列リテラル
    {
      name: '文字列: 全角カッコ',
      code: 'const s = "説明（補足）テキスト";',
      errors: [{ messageId: 'noFullWidthParenInString' }],
      output: 'const s = "説明 (補足) テキスト";'
    },
    {
      name: 'テンプレートリテラル: 全角カッコ',
      code: 'const s = `説明（補足）テキスト`;',
      errors: [{ messageId: 'noFullWidthParenInString' }],
      output: 'const s = `説明 (補足) テキスト`;'
    },
    
    // スペース重複・行末スペース防止
    {
      name: '全角カッコの直前に既にスペースがある場合は重複しない',
      code: '// テスト （値）end',
      errors: [{ messageId: 'noFullWidthParen' }],
      output: '// テスト (値) end'
    },
    {
      name: '全角カッコの直後に既にスペースがある場合は重複しない',
      code: '// テスト（値） end',
      errors: [{ messageId: 'noFullWidthParen' }],
      output: '// テスト (値) end'
    }
  ]
});
/* eslint-enable */

console.log('すべてのテストが通りました！');
