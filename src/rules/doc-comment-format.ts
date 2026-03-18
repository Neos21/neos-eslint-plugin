import type { Rule } from 'eslint';
import type * as ESTree from 'estree';

/** ドキュメンテーションコメントの空行の末尾にスペースを入れる */
export const docCommentFormat: Rule.RuleModule = {
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    docs: {
      description: 'ドキュメンテーションコメントの空行の末尾にスペースを入れる',
      recommended: true
    }
  },
  create: (context: Rule.RuleContext): Rule.RuleListener => {
    const source = context.sourceCode;
    
    return {
      /**
       * Program ノードからドキュメンテーションコメントを検査する
       */
      Program: (): void => {
        const comments = source.getAllComments();
        for(const comment of comments) {
          if(comment.type !== 'Block') continue;
          if(!source.getText(comment as unknown as ESTree.Node).startsWith('/**')) continue;
          
          const text = source.getText(comment as unknown as ESTree.Node);
          const lines = text.split('\n');
          
          let tagLine = -1;
          for(let i = 0; i < lines.length; i++) {
            if((/@param/).test(lines[i]) || (/@return/).test(lines[i]) || (/@throws/).test(lines[i])) {  // `@param` などがあるか否かで修正するべき箇所かを判断している
              tagLine = i;
              break;
            }
          }
          if(tagLine === -1) continue;
          
          const separator = lines[tagLine - 1];
          if(separator.endsWith(' * ')) continue;
          
          // 何個のスペースを入れたら良いか調べる
          const targetIndent = lines[1].match((/^\s+/g))?.[0]?.length ?? 0;
          
          context.report({
            loc: comment.loc as ESTree.SourceLocation,  // NOTE : `/**` の行番号が表示されている
            message: 'ドキュメンテーションコメントの空行の末尾にスペースがありません',
            fix: fixer => {
              const fixed = lines
                .map((line, i) => (i === tagLine - 1 ? ' '.repeat(targetIndent) + '* ' : line))
                .join('\n');
              return fixer.replaceText(comment, fixed);
            }
          });
        }
      }
    };
  }
};
