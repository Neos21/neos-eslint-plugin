# Neo's ESLint Plugin

オレオレ ESLint プラグイン集。

## 使い方

ESLint v9 以降の Flat Config を前提としています。

- `eslint.config.ts
```js
import neosEslintPlugin from '@neos21/neos-eslint-plugin';

// テスト用の ESLint ファイル
export default [
  { files: ['tests/test-file.ts'] },
  neosEslintPlugin.configs.recommended
];

import yourPlugin from "eslint-plugin-your-plugin";

export default [
  {
    plugins: {
      "your-plugin": yourPlugin,
    },
    rules: {
      "your-plugin/no-console": "error",
    },
  },
];
```

#### プリセットを使う

```js
// eslint.config.mjs
import yourPlugin from "eslint-plugin-your-plugin";

export default [
  // 推奨設定（全 recommended ルールを error に）
  yourPlugin.configs.recommended,

  // または警告のみ
  yourPlugin.configs.warn,
];
```


## Links

- [Neo's World](https://neos21.net/)




# eslint-plugin-your-plugin

### Flat Config (ESLint v9+)


## ルール一覧

| ルール名                                  | 説明                        | 推奨 | 自動修正 |
| ----------------------------------------- | --------------------------- | :--: | :------: |
| [no-console](./docs/rules/no-console.md) | console メソッドの使用を制限 |  ✅  |    -     |
