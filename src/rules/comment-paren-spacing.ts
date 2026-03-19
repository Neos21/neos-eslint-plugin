import type { Rule, SourceCode } from 'eslint';
import type { Comment } from 'estree';

interface RuleOptions {
  checkStrings?: boolean;
}

interface ParenMatch {
  index: number;
  isOpen: boolean;  // true = 開き括弧・false = 閉じ括弧
}

/** コメントおよび文字列内の全角カッコを禁止し、半角カッコ + スペース形式を推奨する */
export const commentParenSpacingRule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          checkStrings: {
            type: 'boolean',
            default: true,
            description: '文字列リテラル内の全角カッコもチェックするか否か (デフォルト : true)'
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      noFullWidthParen:'全角カッコは使用禁止です。半角カッコを使用してください (推奨形式 : 「文字 (文字) 文字」)',
      noFullWidthParenInString: '文字列内の全角カッコは使用禁止です。半角カッコを使用してください (推奨形式 : 「文字 (文字) 文字」)'
    },
    docs: {
      description: 'コメントおよび文字列内の全角カッコを禁止し、半角カッコ + スペース形式を推奨する',
      recommended: true
    }
  },
  create: (context: Rule.RuleContext): Rule.RuleListener => {
    const options: RuleOptions = (context.options[0] as RuleOptions) ?? {};
    const sourceCode: SourceCode = context.sourceCode;
    
    // 全角カッコ定義
    const fullWidthOpen  = '\uff08';  // eslint-disable-line neos-eslint-plugin/comment-paren-spacing
    const fullWidthClose = '\uff09';  // eslint-disable-line neos-eslint-plugin/comment-paren-spacing
    
    /** テキスト中の全角カッコをすべて検出する */
    const findFullWidthParens = (text: string): Array<ParenMatch> => {
      const matches: Array<ParenMatch> = [];
      
      for(let i = 0; i < text.length; i++) {
        const ch = text[i];
        if(ch === fullWidthOpen) {
          matches.push({ index: i, isOpen: true });
        }
        else if(ch === fullWidthClose) {
          matches.push({ index: i, isOpen: false });
        }
      }
      
      return matches;
    };
    
    /* eslint-disable neos-eslint-plugin/comment-paren-spacing */
    /**
     * テキスト内の全角カッコをすべて半角に変換し、スペースルールを適用した修正済み文字列を返す
     * 
     * - 「（」→ 「 (」 直前が非スペースなら前にスペースを追加。括弧の内側にはスペース不要
     * - 「）」→ 「) 」 直後が非スペース・テキスト末尾でなければ後ろにスペースを追加
     * - スペースが2連続にならないようにする
     * - 行末・テキスト末尾にスペースが残らないようにする
     */
    /* eslint-enable */
    const applyParenFix = (text: string): string => {
      let result = '';
      
      for(let i = 0; i < text.length; i++) {
        const ch = text[i];
        
        if(ch === fullWidthOpen) {
          // 直前文字 (結果バッファの末尾) を確認して前スペースを付与
          const prevInResult = result.length > 0 ? result[result.length - 1] : null;
          const needSpaceBefore =
            prevInResult !== null &&
            prevInResult !== ' '  &&
            prevInResult !== '\t' &&
            prevInResult !== '\n';
          
          if(needSpaceBefore) result += ' ';
          
          result += '(';
          // 開き括弧の内側にはスペース不要 (「(文字」形式)
        }
        else if(ch === fullWidthClose) {
          result += ')';
          // 直後の文字を確認して後ろスペースを付与
          const nextCh = i + 1 < text.length ? text[i + 1] : null;
          const needSpaceAfter =
            nextCh !== null &&
            nextCh !== ' '  &&
            nextCh !== '\t' &&
            nextCh !== '\n';
          
          if(needSpaceAfter) result += ' ';
        }
        else {
          result += ch;
        }
      }
      
      // 改行がある場合のみ行末スペースを除去 (ブロックコメント末尾の正当なスペースを保持するため単一行・最終行は `trimEnd()` しない)
      if(result.includes('\n')) {
        const lines = result.split('\n');
        result = lines
          .map((line, index) => (index < lines.length - 1 ? line.trimEnd() : line))
          .join('\n');
      }
      
      return result;
    };
    
    /** コメントのチェック */
    const checkComment = (commentValue: string, contentStartOffset: number): void => {
      const parens = findFullWidthParens(commentValue);
      if(parens.length === 0) return;
      
      // 違反があるのでコメント全体を一括修正する
      const fixed = applyParenFix(commentValue);
      if(fixed === commentValue) return;
      
      // 最初の全角カッコの位置を違反報告位置とする
      const firstParen = parens[0];
      const absoluteIndex = contentStartOffset + firstParen.index;
      const loc = sourceCode.getLocFromIndex(absoluteIndex);
      
      context.report({
        loc,
        messageId: 'noFullWidthParen',
        fix: fixer => fixer.replaceTextRange([contentStartOffset, contentStartOffset + commentValue.length], fixed)
      });
    };
    
    /** 文字列コンテンツのチェック */
    const checkStringContent = (content: string, contentStartOffset: number): void => {
      const { checkStrings = true } = options;
      if(!checkStrings) return;
      
      const parens = findFullWidthParens(content);
      if(parens.length === 0) return;
      
      const fixed = applyParenFix(content);
      if(fixed === content) return;
      
      const firstParen = parens[0];
      const absoluteIndex = contentStartOffset + firstParen.index;
      const loc = sourceCode.getLocFromIndex(absoluteIndex);
      
      context.report({
        loc,
        messageId: 'noFullWidthParenInString',
        fix: fixer => fixer.replaceTextRange([contentStartOffset, contentStartOffset + content.length], fixed)
      });
    };
    
    return {
      Program: (): void => {
        const comments = sourceCode.getAllComments() as Array<Comment>;
        
        for(const comment of comments) {
          if(comment.range == null) continue;
          
          if(comment.type === 'Line') {
            // `//` の2文字分のオフセット
            const contentStart = comment.range[0] + 2;
            checkComment(comment.value, contentStart);
          }
          else if(comment.type === 'Block') {
            // `/*` の2文字分のオフセット
            const contentStart = comment.range[0] + 2;
            checkComment(comment.value, contentStart);
          }
        }
      },
      Literal: (node): void => {
        if(typeof node.value !== 'string' || node.range == null || node.raw === undefined) return;
        
        const contentStart = node.range[0] + 1;
        checkStringContent(node.value, contentStart);
      },
      TemplateLiteral: (node): void => {
        for(const quasi of node.quasis) {
          if(quasi.range == null) continue;
          const cooked = quasi.value.cooked;
          if(cooked === null || cooked === undefined) continue;
          const contentStart = quasi.range[0] + 1;
          checkStringContent(cooked, contentStart);
        }
      }
    };
  }
};
