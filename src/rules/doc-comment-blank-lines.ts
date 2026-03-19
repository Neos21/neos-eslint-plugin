import type { Rule, SourceCode } from 'eslint';
import type { Comment } from 'estree';

interface ViolationType {
  shouldBeSingleLine: boolean;
  missingEmptySecondLine: boolean;
  missingEmptyBeforeTagBlock: boolean;
}

/** ドキュメンテーションコメントのフォーマットを統一する */
export const docCommentBlankLines: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    schema: [],
    messages: {
      shouldBeSingleLine: '1行で収まるドキュメンテーションコメントは1行形式で書いてください : 「/** 説明 */」',
      missingEmptySecondLine: '複数行ドキュメンテーションの2行目は空行にしてください',
      missingEmptyBeforeTagBlock: '@param・@return・@throws の直前には空行を入れてください'
    },
    docs: {
      description: 'ドキュメンテーションコメントのフォーマットを統一する',
      recommended: true
    }
  },
  create: (context: Rule.RuleContext): Rule.RuleListener => {
    const sourceCode: SourceCode = context.sourceCode;
    
    /** Tags のかたまりとして扱うタグ */
    const blockTags = new Set(['@param', '@return', '@throws']);
    
    /** ドキュメンテーションコメントかどうかを判定する */
    const isJsdoc = (comment: Comment): boolean => comment.type === 'Block' && comment.value.startsWith('*');
    
    /** raw 行からコンテンツテキストを取り出す (` * テキスト` → `テキスト`) */
    const extractContent = (rawLine: string): string => rawLine.replace(/^\s*\*\s?/, '').trimEnd();
    
    /** タグ行かどうかを判定する */
    const isTagLine = (content: string): boolean => [...blockTags].some(tag => content.trimStart().startsWith(tag));
    
    /** 空行 (コンテンツが空) かどうか */
    const isEmptyContent = (content: string): boolean => content.trim() === '';
    
    /** コメントが置かれている行のインデントを返す */
    const getIndent = (sourceCode: SourceCode, comment: Comment): string => {
      if(comment.loc == null) return '';
      const lineText = sourceCode.lines[comment.loc.start.line - 1];
      const match = lineText.match(/^(\s*)/);
      return match != null ? match[1] : '';
    };
    
    const analyzeJsdoc = (value: string): ViolationType => {
      const rawLines = value.split('\n');
      const isSingleLine = rawLines.length === 1;
      
      if(isSingleLine) {
        return {
          shouldBeSingleLine: false,
          missingEmptySecondLine: false,
          missingEmptyBeforeTagBlock: false
        };
      }
      
      // コンテンツ行 : 先頭行 (`/**` の `*` 部分) と末尾行 (` */` 手前の空白行) を除く
      const contentLines = rawLines
        .slice(1, rawLines.length - 1)
        .map(extractContent);
      
      const nonEmptyLines = contentLines.filter(l => !isEmptyContent(l));
      
      // 1. 1行化すべきか
      const shouldBeSingleLine =
        nonEmptyLines.length === 1 && !nonEmptyLines.some(isTagLine);
      
      if(shouldBeSingleLine) {
        return {
          shouldBeSingleLine: true,
          missingEmptySecondLine: false,
          missingEmptyBeforeTagBlock: false
        };
      }
      
      // 2. 2行目空行チェック : contentLines[1] が空でない場合に違反
      const missingEmptySecondLine =
        contentLines.length >= 2 &&
        !isEmptyContent(contentLines[0]) &&
        !isEmptyContent(contentLines[1]);
      
      // 3. タグブロック前空行チェック
      // タグが連続する場合はブロックの「先頭タグ」の直前のみチェック
      let missingEmptyBeforeTagBlock = false;
      for(let i = 1; i < contentLines.length; i++) {
        const curr = contentLines[i];
        const prev = contentLines[i - 1];
        if(isTagLine(curr) && !isTagLine(prev) && !isEmptyContent(prev)) {
          missingEmptyBeforeTagBlock = true;
          break;
        }
      }
      
      return {
        shouldBeSingleLine: false,
        missingEmptySecondLine,
        missingEmptyBeforeTagBlock
      };
    };
    
    /** 修正 : コメントを再構築する */
    const fixJsdoc = (value: string, indent: string): string => {
      const rawLines = value.split('\n');
      const isSingleLine = rawLines.length === 1;
      
      if(isSingleLine) return '/** ' + value.replace(/^\*\s*/, '').trim() + ' */';
      
      let contentLines = rawLines
        .slice(1, rawLines.length - 1)
        .map(extractContent);
      
      const nonEmptyLines = contentLines.filter(l => !isEmptyContent(l));
      
      // 1行化
      if(nonEmptyLines.length === 1 && !nonEmptyLines.some(isTagLine)) return '/** ' + nonEmptyLines[0].trim() + ' */';
      
      // 2行目が空行でなければ挿入
      if(
        contentLines.length >= 1 &&
        !isEmptyContent(contentLines[0]) &&
        (contentLines.length === 1 || !isEmptyContent(contentLines[1]))
      ) {
        contentLines = [contentLines[0], '', ...contentLines.slice(1)];
      }
      
      // タグブロック前に空行を挿入
      // タグが連続する場合はブロックの「先頭タグ」の直前のみ挿入
      const withTagGaps: Array<string> = [];
      for(let i = 0; i < contentLines.length; i++) {
        const curr = contentLines[i];
        const prev = i > 0 ? contentLines[i - 1] : null;
        if(
          prev !== null &&
          isTagLine(curr) &&
          !isTagLine(prev) &&
          !isEmptyContent(prev)
        ) {
          withTagGaps.push('');
        }
        withTagGaps.push(curr);
      }
      
      // 再構築
      const bodyLines = withTagGaps.map(line => {
        if(isEmptyContent(line)) {
          // 空行は「<indent> * 」 (行末スペースあり)
          return indent + ' * ';
        }
        return (indent + ' * ' + line).trimEnd();
      });
      
      return '/**\n' + bodyLines.join('\n') + '\n' + indent + ' */';
    };
    
    const check = (comment: Comment): void => {
      if(!isJsdoc(comment)) return;
      if(comment.range == null) return;
      
      const {
        shouldBeSingleLine,
        missingEmptySecondLine,
        missingEmptyBeforeTagBlock
      } = analyzeJsdoc(comment.value);
      
      if(
        !shouldBeSingleLine &&
        !missingEmptySecondLine &&
        !missingEmptyBeforeTagBlock
      ) {
        return;
      }
      
      const indent = getIndent(sourceCode, comment);
      const fixed = fixJsdoc(comment.value, indent);
      
      const messageId = shouldBeSingleLine
        ? 'shouldBeSingleLine'
        : missingEmptySecondLine
          ? 'missingEmptySecondLine'
          : 'missingEmptyBeforeTagBlock';
      
      context.report({
        loc: comment.loc!,
        messageId,
        fix: fixer => fixer.replaceTextRange(comment.range!, fixed)
      });
    };
    
    return {
      Program: (): void => {
        const comments = sourceCode.getAllComments() as Array<Comment>;
        for(const comment of comments) check(comment);
      }
    };
  }
};
