import type { Rule, SourceCode } from 'eslint';
import type { Comment } from 'estree';

interface RuleOptions {
  allowFullWidth?: boolean;
  requireSpaceBefore?: boolean;
  checkStrings?: boolean;
}

interface ColonMatch {
  index: number;
  isFullWidth: boolean;
}

/** コメントおよび文字列内のコロン記法を統一する : 全角コロン禁止・前後スペース推奨 */
export const commentColonSpacingRule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          allowFullWidth: {
            type: 'boolean',
            default: false,
            description: '全角コロンの使用を許可するか否か (デフォルト : false)'
          },
          requireSpaceBefore: {
            type: 'boolean',
            default: true,
            description: '半角コロンの前にスペースを要求するか否か (デフォルト : true)・false で「文字: 文字」形式も許容する'  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
          },
          checkStrings: {
            type: 'boolean',
            default: true,
            description: '文字列リテラル内のコロンもチェックするか否か (デフォルト : true)'
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      noFullWidthColon: '全角コロンは使用禁止です。半角コロンを使用してください',
      noSpaceBeforeColon: 'コロンの前にスペースを入れてください (推奨形式 : 「文字 : 文字」)',
      noSpaceAfterColon: 'コロンの後にスペースを入れてください (推奨形式 : 「文字 : 文字」)',
      noFullWidthColonInString: '文字列内の全角コロンは使用禁止です。半角コロンを使用してください',
      noSpaceBeforeColonInString: '文字列内のコロンの前にスペースを入れてください (推奨形式 : 「文字 : 文字」)',
      noSpaceAfterColonInString: '文字列内のコロンの後にスペースを入れてください (推奨形式 : 「文字 : 文字」)'
    },
    docs: {
      description: 'コメントおよび文字列内のコロン記法を統一する : 全角コロン禁止・前後スペース推奨',
      recommended: true
    }
  },
  create: (context: Rule.RuleContext): Rule.RuleListener => {
    const options: RuleOptions = (context.options[0] as RuleOptions) ?? {};
    const sourceCode: SourceCode = context.sourceCode;
    
    /* eslint-disable neos-eslint-plugin/comment-colon-spacing */
    /**
     * コロンが URL・モジュールスキーム・Windows パスの一部か否かを判定する
     * 
     * スキップ対象 :
     * - `://` パターン (`https://`・`http://` など)
     * - RFC 3986 スキーム形式 `識別子:識別子` で前後が ASCII 英数字のみ (`node:fs`・`node:path` など)
     * - Windows ドライブレター `[A-Za-z]:[\\\/]` (`C:\PATH`・`D:/dir` など)
     */
    /* eslint-enable */
    const isSchemeColon = (text: string, colonIndex: number): boolean => {
      // `://` パターン
      if(text.slice(colonIndex + 1, colonIndex + 3) === '//') return true;
      
      // Windows ドライブレター : 直前が英字 1 文字・直後が `\` または `/`
      // かつドライブレターの前が区切り文字 (行頭・スペース・クォートなど) である場合のみ
      if(colonIndex >= 1) {
        const driveLetter = text[colonIndex - 1];
        const afterColon  = colonIndex + 1 < text.length ? text[colonIndex + 1] : null;
        const beforeDrive = colonIndex >= 2 ? text[colonIndex - 2] : null;
        const isDriveSeparated =
          beforeDrive === null ||
          beforeDrive === ' '  ||
          beforeDrive === '\t' ||
          beforeDrive === '\n' ||
          beforeDrive === '\'' ||
          beforeDrive === '"'  ||
          beforeDrive === '`';
        if(
          /^[A-Za-z]$/.test(driveLetter) &&
          (afterColon === '\\' || afterColon === '/') &&
          isDriveSeparated
        ) return true;
      }
      
      // RFC 3986 スキーム形式 : 前が `[a-zA-Z][a-zA-Z0-9+\-.]*`・後ろが ASCII 英数字列
      // 日本語など非 ASCII が前後にある場合はスキームとみなさない
      const schemePattern = /^[a-zA-Z][a-zA-Z0-9+\-.]*$/;
      const beforeWord = text.slice(0, colonIndex).match(/([a-zA-Z][a-zA-Z0-9+\-.]*)$/);
      const afterWord  = text.slice(colonIndex + 1).match(/^([a-zA-Z0-9_\-/.]+)/);
      if(beforeWord != null && afterWord != null && schemePattern.test(beforeWord[1])) return true;
      
      return false;
    };
    
    /** テキスト中のコロン (全角・半角) をすべて検出する (URL・スキーム・Windows パスを除く) */
    const findColonsInText = (text: string): Array<ColonMatch> => {
      const matches: Array<ColonMatch> = [];
      
      for(let i = 0; i < text.length; i++) {
        const ch = text[i];
        // 全角コロン
        const isFullWidth = ch === '\uff1a';  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
        const isHalfWidth = ch === ':';
        
        if(!isFullWidth && !isHalfWidth) continue;
        
        // スキーム・Windows パスのコロンはスキップ
        if(isHalfWidth && isSchemeColon(text, i)) continue;
        
        matches.push({ index: i, isFullWidth });
      }
      
      return matches;
    };
    
    /* eslint-disable neos-eslint-plugin/comment-colon-spacing */
    /**
     * コロン位置を解析し、違反の種類を返す
     * 
     * チェック対象パターン (前後どちらかに非空白文字がある場合) :
     * - fullwidth       : 全角コロン (`allowFullWidth=false` の場合)
     * - no-space-before : 「文字:文字」「文字: 文字」 → 前にスペースが必要
     * - no-space-after  : 「文字 :文字」 → 後ろにスペースが必要
     *
     * スキップするパターン :
     * - 前後ともスペース・行頭行末 (単独コロン)
     * - 「文字 : 文字」正しい形式
     * - 文末「文字:」「文字 :」(後ろに何もない)
     */
    /* eslint-enable */
    const analyzeColonPosition = (text: string, colonIndex: number, isFullWidth: boolean, options: RuleOptions): { type: 'fullwidth' | 'no-space-before' | 'no-space-after' } | null => {
      const { allowFullWidth = false, requireSpaceBefore = true } = options;
      
      if(isFullWidth) return allowFullWidth ? null : { type: 'fullwidth' };
      
      if(!requireSpaceBefore) return null;
      
      const prevChar = colonIndex > 0 ? text[colonIndex - 1] : null;
      const nextChar = colonIndex < text.length - 1 ? text[colonIndex + 1] : null;
      
      const prevIsSpace    = prevChar === null || prevChar === ' ' || prevChar === '\t' || prevChar === '\n';
      const nextIsSpace    = nextChar === null || nextChar === ' ' || nextChar === '\t' || nextChar === '\n';
      const prevIsNonSpace = !prevIsSpace;
      const nextIsNonSpace = !nextIsSpace;
      
      // 両側がスペース・境界 (単独コロン) → 対象外
      if(prevIsSpace && nextIsSpace) return null;
      
      // 前が非スペース → no-space-before (後ろが文字でもスペースでも違反)
      // ただし後ろが行末 (nextChar===null) のみの場合はスキップ
      if(prevIsNonSpace && nextChar === null) return null;  // 「文字コロン」文末
      
      if(prevIsNonSpace) return { type: 'no-space-before' };
      
      // 前はスペース・後ろが非スペース文字 → no-space-after
      if(prevIsSpace && nextIsNonSpace) return { type: 'no-space-after' };
      
      // 「スペース : スペース」正常
      return null;
    };
    
    /** コメントのチェック */
    const checkComment = (commentValue: string, contentStartOffset: number): void => {
      const colons = findColonsInText(commentValue);
      
      for(const { index, isFullWidth } of colons) {
        const violation = analyzeColonPosition(commentValue, index, isFullWidth, options);
        if(violation == null) continue;
        
        const absoluteIndex = contentStartOffset + index;
        const loc = sourceCode.getLocFromIndex(absoluteIndex);
        
        if(violation.type === 'fullwidth') {
          context.report({
            loc,
            messageId: 'noFullWidthColon',
            fix: fixer => fixer.replaceTextRange([absoluteIndex, absoluteIndex + 1], ':')
          });
        }
        else if(violation.type === 'no-space-before') {
          context.report({
            loc,
            messageId: 'noSpaceBeforeColon',
            fix: fixer => fixer.replaceTextRange([absoluteIndex, absoluteIndex], ' ')
          });
        }
        else if(violation.type === 'no-space-after') {
          context.report({
            loc,
            messageId: 'noSpaceAfterColon',
            fix: fixer => fixer.replaceTextRange([absoluteIndex + 1, absoluteIndex + 1], ' ')
          });
        }
      }
    };
    
    /** 文字列コンテンツのチェック */
    const checkStringContent = (content: string, contentStartOffset: number): void => {
      const { checkStrings = true } = options;
      if(!checkStrings) return;
      
      const colons = findColonsInText(content);
      
      for(const { index, isFullWidth } of colons) {
        const violation = analyzeColonPosition(content, index, isFullWidth, options);
        if(violation == null) continue;
        
        const absoluteIndex = contentStartOffset + index;
        const loc = sourceCode.getLocFromIndex(absoluteIndex);
        
        if(violation.type === 'fullwidth') {
          context.report({
            loc,
            messageId: 'noFullWidthColonInString',
            fix: fixer => fixer.replaceTextRange([absoluteIndex, absoluteIndex + 1], ':')
          });
        }
        else if(violation.type === 'no-space-before') {
          context.report({
            loc,
            messageId: 'noSpaceBeforeColonInString',
            fix: fixer => fixer.replaceTextRange([absoluteIndex, absoluteIndex], ' ')
          });
        }
        else if(violation.type === 'no-space-after') {
          context.report({
            loc,
            messageId: 'noSpaceAfterColonInString',
            fix: fixer => fixer.replaceTextRange([absoluteIndex + 1, absoluteIndex + 1], ' ')
          });
        }
      }
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
        
        // クォート文字 (1文字) 分のオフセット
        const contentStart = node.range[0] + 1;
        checkStringContent(node.value, contentStart);
      },
      TemplateLiteral: (node): void => {
        for(const quasi of node.quasis) {
          if(quasi.range == null) continue;
          const cooked = quasi.value.cooked;
          if(cooked === null || cooked === undefined) continue;
          // テンプレートリテラルのバッククォート/式区切りのオフセット
          // head・middle は ` または } (1文字)
          const contentStart = quasi.range[0] + 1;
          checkStringContent(cooked, contentStart);
        }
      }
    };
  }
};
