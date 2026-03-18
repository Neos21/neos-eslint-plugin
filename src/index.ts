import { Linter } from 'eslint';

import { blankLineIndent } from './rules/blank-line-indent.js';
import { commentColonSpacingRule } from './rules/comment-colon-spacing';
import { docCommentFormat } from './rules/doc-comment-format.js';
import { newlineBeforeStatement } from './rules/newline-before-statement.js';
import { noSpaceBeforeParen } from './rules/no-space-before-paren.js';

/** プラグイン名 */
const pluginName = 'neos-eslint-plugin' as const;

/** ルール一覧 */
const rules = {
  'blank-line-indent'       : blankLineIndent,
  'comment-colon-spacing'   : commentColonSpacingRule,
  'doc-comment-format'      : docCommentFormat,
  'newline-before-statement': newlineBeforeStatement,
  'no-space-before-paren'   : noSpaceBeforeParen
};

/** 推奨設定定義 */
export const configs = {
  /** 推奨設定 : 全てのルールを有効にする */
  recommended: {
    plugins: { [pluginName]: { rules } },
    rules: Object.fromEntries(
      Object.entries(rules)
        .filter(([_, rule]) => rule.meta!.docs!.recommended === true)  // eslint-disable-line @typescript-eslint/no-unused-vars
        .map(([name]) => [`${pluginName}/${name}`, 'error'])
    )
  } satisfies Linter.Config,
  
  /** 警告のみ表示 */
  warn: {
    plugins: { [pluginName]: { rules } },
    rules: Object.fromEntries(
      Object.entries(rules)
        .filter(([_, rule]) => rule.meta!.docs!.recommended === true)  // eslint-disable-line @typescript-eslint/no-unused-vars
        .map(([name]) => [`${pluginName}/${name}`, 'warn'])
    )
  } satisfies Linter.Config
};

/** プラグイン定義 : `export default` する */
const plugin = { rules, configs };

export default plugin;
