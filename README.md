# Neo's ESLint Plugin

[![NPM Version](https://img.shields.io/npm/v/@neos21/neos-eslint-plugin.svg)](https://www.npmjs.com/package/@neos21/neos-eslint-plugin) [![GPR Version](https://img.shields.io/github/package-json/v/neos21/neos-eslint-plugin?label=github)](https://github.com/Neos21/neos-eslint-plugin/pkgs/npm/neos-eslint-plugin)

オレオレ ESLint プラグイン集。


## 使い方

```bash
$ npm install --save-dev @neos21/neos-eslint-plugin
```

ESLint v9 以降の Flat Config を前提としています。

- `eslint.config.ts` (or ESM) : 使用したいルールだけを `rules` に記載し、`warn` または `error` を指定します

```typescript
import neosEslintPlugin from '@neos21/neos-eslint-plugin';

export default [
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'neos-eslint-plugin': neosEslintPlugin
    },
    rules: {
      'neos-eslint-plugin/blank-line-indent'       : 'error',
      'neos-eslint-plugin/doc-comment-format'      : 'error',
      'neos-eslint-plugin/newline-before-statement': 'error',
      'neos-eslint-plugin/no-space-before-paren'   : 'error'
    }
  }
];
```

全ルールを推奨設定を利用する場合は以下のように書けます。

```typescript
import neosEslintPlugin from '@neos21/neos-eslint-plugin';

export default [
  { files: ['src/**/*.{js,jsx,ts,tsx}'] },
  neosEslintPlugin.configs.recommended
];
```

全ルールをエラーレベルではなくワーニングレベルで出力する場合は以下を使用できます。

```typescript
import neosEslintPlugin from '@neos21/neos-eslint-plugin';

export default [
  { files: ['src/**/*.{js,jsx,ts,tsx}'] },
  neosEslintPlugin.configs.warn
];
```

CommonJS での利用時は `.default` を付けて `require()` してください。後の書き方は同じです。

```javascript
const neosEslintPlugin = require('@neos21/neos-eslint-plugin').default;

module.exports = [...];
```


## ルール一覧

- `blank-line-indent` : 空行にその行が属するブロックのインデント深さに合わせたスペースを入れる … Auto Fix 対応
- `doc-comment-format` : ドキュメンテーションコメントの空行の末尾にスペースを入れる … Auto Fix 対応
- `newline-before-statement` : `else`・`else if`・`catch`・`finally`・`while` の直前に改行を入れる … Auto Fix 対応
- `no-space-before-paren` : `if`・`else if`・`catch`・`for`・`switch`・`while` の直後のカッコとの間にスペースを開けない


## 開発

- `package.json`
    - `main` : CommonJS のエントリポイント
    - `module` : ESM のエントリポイント
    - `types` : TypeScript 向け型定義 `.d.ts` のエントリポイント
    - `exports` : Node.js v12 以降向けのエントリポイント定義
        - `require` : CommonJS
        - `import` : ESM
        - `types` : TypeScript
    - `files` : `npm publish` 時に同梱されるファイル・ディレクトリ
    - `peerDependencies` : Flat Config 前提のため ESLint v9 以降を対象とするよう指定した
- `.npmignore` : `package.json` の `files` と併せて除外するファイル・ディレクトリを定義する・ビルド後の資材だけ含まれる用に設定した


## Links

- [Neo's World](https://neos21.net/)
- [npm - @neos21/neos-eslint-plugin](https://www.npmjs.com/package/@neos21/neos-eslint-plugin)
