import { RuleTester } from 'eslint';
import { commentColonSpacingRule } from '../src/rules/comment-colon-spacing';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  }
});

tester.run('comment-colon-spacing', commentColonSpacingRule, {
  valid: [
    // デフォルトオプション : 正しい形式 (文字 : 文字)
    {
      name: '単一行コメント : 正しい形式',
      code: '// 項目 : 説明'
    },
    {
      name: '単一行コメント : URL 内のコロンはスキップ (`//` の直後なので対象外)',
      code: 'const x = 1;  // https://example.com は OK'
    },
    {
      name: '複数行コメント : 正しい形式',
      code: '/* キー : バリュー */'
    },
    {
      name: 'ドキュメンテーションコメント : 正しい形式',
      code: '/** @param name : 名前の説明 */'
    },
    {
      name: '文字列 : 正しい形式',
      code: 'const s = "タイトル : 説明";'
    },
    {
      name: 'テンプレートリテラル : 正しい形式',
      code: 'const s = `タイトル : 説明`;'
    },
    {
      name: 'コロンが文末にある (後ろに文字なし)',
      code: '// 項目:'
    },
    
    // allowFullWidth : true
    {
      name: '全角コロン : allowFullWidth=true で許可',
      code: '// 項目：説明',
      options: [{ allowFullWidth: true }]
    },
    
    // requireSpaceBefore: false
    {
      name: 'requireSpaceBefore=false : 前スペースなしを許可',
      code: '// 項目: 説明',
      options: [{ requireSpaceBefore: false }]
    },
    {
      name: 'requireSpaceBefore=false : 文字列内も許可',
      code: 'const s = "項目: 説明";',
      options: [{ requireSpaceBefore: false }]
    },
    
    // checkStrings : false
    {
      name: 'checkStrings=false : 文字列内は無視',
      code: 'const s = "項目: 説明";',
      options: [{ checkStrings: false }]
    },
    {
      name: 'checkStrings=false : テンプレートリテラル内も無視',
      code: 'const s = `項目: 説明`;',
      options: [{ checkStrings: false }]
    }
  ],
  
  invalid: [
    // 全角コロン禁止 (デフォルト)
    {
      name: '単一行コメント : 全角コロン禁止',
      code: '// 項目：説明',
      errors: [{ messageId: 'noFullWidthColon' }],
      output: '// 項目:説明'
    },
    {
      name: '複数行コメント : 全角コロン禁止',
      code: '/* キー：バリュー */',
      errors: [{ messageId: 'noFullWidthColon' }],
      output: '/* キー:バリュー */'
    },
    {
      name: 'ドキュメンテーションコメント : 全角コロン禁止',
      code: '/** 型：string */',
      errors: [{ messageId: 'noFullWidthColon' }],
      output: '/** 型:string */'
    },
    {
      name: '文字列 : 全角コロン禁止',
      code: 'const s = "項目：説明";',
      errors: [{ messageId: 'noFullWidthColonInString' }],
      output: 'const s = "項目:説明";'
    },
    {
      name: 'テンプレートリテラル : 全角コロン禁止',
      code: 'const s = `項目：説明`;',
      errors: [{ messageId: 'noFullWidthColonInString' }],
      output: 'const s = `項目:説明`;'
    },
    
    // 前スペースなし (デフォルト : requireSpaceBefore=true)
    {
      name: '単一行コメント : コロン前スペースなし',
      code: '// 項目: 説明',
      errors: [{ messageId: 'noSpaceBeforeColon' }],
      output: '// 項目 : 説明'
    },
    {
      name: '複数行コメント : コロン前スペースなし',
      code: '/* キー: バリュー */',
      errors: [{ messageId: 'noSpaceBeforeColon' }],
      output: '/* キー : バリュー */'
    },
    {
      name: '文字列 : コロン前スペースなし',
      code: 'const s = "項目: 説明";',
      errors: [{ messageId: 'noSpaceBeforeColonInString' }],
      output: 'const s = "項目 : 説明";'
    },
    
    // 後ろスペースなし
    {
      name: '単一行コメント : コロン後スペースなし',
      code: '// 項目 :説明',
      errors: [{ messageId: 'noSpaceAfterColon' }],
      output: '// 項目 : 説明'
    },
    {
      name: '文字列 : コロン後スペースなし',
      code: 'const s = "項目 :説明";',
      errors: [{ messageId: 'noSpaceAfterColonInString' }],
      output: 'const s = "項目 : 説明";'
    },
    
    // 複数違反
    {
      name: '単一行コメント : 複数の違反',
      code: '// 項目：説明 キー: 値',
      errors: [
        { messageId: 'noFullWidthColon' },
        { messageId: 'noSpaceBeforeColon' },
      ],
      output: '// 項目:説明 キー : 値'
    }
  ]
});

console.log('すべてのテストが通りました！');
