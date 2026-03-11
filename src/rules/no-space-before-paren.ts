import type { AST, Rule } from 'eslint';
import type * as ESTree from 'estree';

/** if・else if・catch・for・switch・while の直後のカッコとの間にスペースを開けない */
export const noSpaceBeforeParen: Rule.RuleModule = {
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    docs: {
      description: 'if・else if・catch・for・switch・while の直後のカッコとの間にスペースを開けない',
      recommended: true
    }
  },
  create: (context: Rule.RuleContext): Rule.RuleListener => {
    const sourceCode = context.sourceCode;
    
    /**
     * キーワードと括弧の間の空白を検査して必要なら修正する
     * 
     * @param node 報告対象ノード
     * @param keywordToken 対象キーワードトークン
     */
    const checkKeywordParen = (node: ESTree.Node, keywordToken: AST.Token): void => {
      const nextToken = sourceCode.getTokenAfter(keywordToken);
      if(nextToken == null || nextToken.value !== '(') return;
      
      const keywordEnd = keywordToken.range[1];
      const parenStart = nextToken.range[0];
      
      // キーワード終端と `(` の開始位置が離れていれば空白あり
      if(keywordEnd < parenStart) {
        context.report({
          node,
          loc: {
            start: keywordToken.loc.end,
            end  : nextToken.loc.start
          },
          message: 'キーワード {{keyword}} と ( の間に不要なスペースがあります',
          data: { keyword: keywordToken.value },
          fix: fixer => {
            // キーワード直後から `(` の直前までを削除する
            return fixer.removeRange([keywordEnd, parenStart]);
          }
        });
      }
    };
    
    /** if・else if の括弧前スペースを検査する */
    const handleIfStatement = (node: ESTree.IfStatement): void => {
      const ifToken = sourceCode.getFirstToken(node) as AST.Token;
      checkKeywordParen(node, ifToken);
    };
    
    /** for の括弧前スペースを検査する */
    const handleForStatement = (node: ESTree.ForStatement): void => {
      const forToken = sourceCode.getFirstToken(node) as AST.Token;
      checkKeywordParen(node, forToken);
    };
    
    /** for of の括弧前スペースを検査する */
    const handleForOfStatement = (node: ESTree.ForOfStatement): void => {
      const forToken = sourceCode.getFirstToken(node) as AST.Token;
      checkKeywordParen(node, forToken);
    };
    
    /** for in の括弧前スペースを検査する */
    const handleForInStatement = (node: ESTree.ForInStatement): void => {
      const forToken = sourceCode.getFirstToken(node) as AST.Token;
      checkKeywordParen(node, forToken);
    };
    
    /** switch の括弧前スペースを検査する */
    const handleSwitchStatement = (node: ESTree.SwitchStatement): void => {
      const switchToken = sourceCode.getFirstToken(node) as AST.Token;
      checkKeywordParen(node, switchToken);
    };
    
    /** catch の括弧前スペースを検査する */
    const handleCatchClause = (node: ESTree.CatchClause): void => {
      const catchToken = sourceCode.getFirstToken(node) as AST.Token;
      checkKeywordParen(node, catchToken);
    };
    
    /** while の括弧前スペースを検査する */
    const handleWhileStatement = (node: ESTree.WhileStatement): void => {
      const whileToken = sourceCode.getFirstToken(node) as AST.Token;
      checkKeywordParen(node, whileToken);
    };
    
    /** do while の括弧前スペースを検査する */
    const handleDoWhileStatement = (node: ESTree.DoWhileStatement): void => {
      /** while トークンか否か判定する */
      const isWhileToken = (token: AST.Token): boolean => token.value === 'while';
      
      const whileToken = sourceCode.getTokenAfter(node.body, isWhileToken);
      if(whileToken == null) return;
      checkKeywordParen(node, whileToken);
    };
    
    return {
      // if・else if
      IfStatement: handleIfStatement,
      // for
      ForStatement: handleForStatement,
      // for of
      ForOfStatement: handleForOfStatement,
      // for in
      ForInStatement: handleForInStatement,
      // switch
      SwitchStatement: handleSwitchStatement,
      // catch : TryStatement の handler (CatchClause) を使う
      CatchClause: handleCatchClause,
      // while
      WhileStatement: handleWhileStatement,
      // do while
      DoWhileStatement: handleDoWhileStatement
    };
  }
};
