import { defineConfig } from 'tsup';

/** ビルドに使用する tsup の設定 */
export default defineConfig({
  // エントリポイント
  entry: ['src/index.ts'],
  // 除外
  external: ['tests'],
  // 出力フォーマット
  format: ['esm', 'cjs'],
  // 出力先ディレクトリをビルド前に削除する
  clean: true,
  // `.d.ts` 型定義ファイルを生成する
  dts: true,
  // Code Split しない (`false`) = CJS 向け
  splitting: false,
  // マップファイルを作る
  sourcemap: true,
  // esbuild のツリーシェイキングに追加して Rollup によるツリーシェイキングも行う
  treeshake: true
});
