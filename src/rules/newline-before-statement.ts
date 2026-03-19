import type { AST, Rule } from 'eslint';
import type * as ESTree from 'estree';

/** else・else if・catch・finally・while の直前に改行を入れる */
export const newlineBeforeStatement: Rule.RuleModule = {
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    docs: {
      description: 'else・else if・catch・finally・while の直前に改行を入れる',
      recommended: true
    }
  },
  create: (context: Rule.RuleContext): Rule.RuleListener => {
    const sourceCode = context.sourceCode;
    
    /** あるノードが始まっている行の行頭インデント文字列を返す */
    const getIndentOf = (node: ESTree.Node): string => {
      const loc = node.loc as ESTree.SourceLocation;
      const line = sourceCode.lines[loc.start.line - 1] ?? '';
      const match = line.match((/^(\s*)/));
      return match != null ? match[1] : '';
    };
    
    /**
     * keywordToken の直前が同一行かどうかを確認し必要なら改行を追加する
     * 
     * @param node 報告対象ノード
     * @param keywordToken 対象キーワードトークン
     * @param ownerNode インデント基準ノード
     */
    const checkNewlineBefore = (node: ESTree.Node, keywordToken: AST.Token, ownerNode: ESTree.Node): void => {
      const tokenBefore = sourceCode.getTokenBefore(keywordToken);
      if(tokenBefore == null) return;
      
      // 直前トークンと keyword が同じ行にある場合のみエラーとし修正する
      if(tokenBefore.loc.end.line === keywordToken.loc.start.line) {
        // 対応する if・try・do の行頭インデントを使う
        const indent = getIndentOf(ownerNode);
        context.report({
          node,
          loc: keywordToken.loc,
          message: '以下の前ステートメントの直前に改行が必要です : \'{{keyword}}\'',
          data: { keyword: keywordToken.value },
          fix: fixer => {
            // 直前トークン終端 〜 keyword 開始位置を `\n<indent>` に置換する
            return fixer.replaceTextRange([tokenBefore.range[1], keywordToken.range[0]], '\n' + indent);
          }
        });
      }
    };
    
    /** else if の改行位置を検査する */
    const handleIfStatement = (node: ESTree.IfStatement): void => {
      // この IfStatement が別の IfStatement の alternate (= else if / else) か否か・そうであれば親から見た else キーワードを検査する
      const parent = (node as ESTree.IfStatement & { parent?: ESTree.Node | null }).parent;
      if(parent != null && parent.type === 'IfStatement' && parent.alternate === node) {
        // else トークンを取得する (consequent の直後にある)
        const elseToken = sourceCode.getTokenBefore(node);
        if(elseToken != null && elseToken.value === 'else') {
          // インデント基準はルート if (チェーンを遡る)
          let root = parent as ESTree.IfStatement & { parent?: ESTree.Node | null };
          while(root.parent != null && root.parent.type === 'IfStatement' && root.parent.alternate === root) {
            root = root.parent as ESTree.IfStatement & { parent?: ESTree.Node | null };
          }
          checkNewlineBefore(node, elseToken, root);
        }
      }
    };
    
    /** else の改行位置を検査する */
    const handleIfStatementExit = (node: ESTree.IfStatement): void => {
      if(node.alternate == null) return;
      // alternate が IfStatement のときは上の IfStatement ハンドラで処理済
      if(node.alternate.type === 'IfStatement') return;
      // else トークンを取得する
      const elseToken = sourceCode.getTokenBefore(node.alternate);
      if(elseToken != null && elseToken.value === 'else') checkNewlineBefore(node.alternate, elseToken, node);
    };
    
    /** catch の改行位置を検査する */
    const handleCatchClause = (node: ESTree.CatchClause): void => {
      const catchToken = sourceCode.getFirstToken(node);
      // インデント基準は親の TryStatement
      if(catchToken != null && catchToken.value === 'catch') {
        const parent = (node as ESTree.CatchClause & { parent?: ESTree.Node }).parent;
        checkNewlineBefore(node, catchToken, parent as ESTree.Node);
      }
    };
    
    /** finally の改行位置を検査する */
    const handleTryStatement = (node: ESTree.TryStatement): void => {
      if(node.finalizer == null) return;
      const finallyToken = sourceCode.getTokenBefore(node.finalizer);
      if(finallyToken != null && finallyToken.value === 'finally') checkNewlineBefore(node.finalizer, finallyToken, node);
    };
    
    /** do while の改行位置を検査する */
    const handleDoWhileStatement = (node: ESTree.DoWhileStatement): void => {
      /** while トークンか否か判定する */
      const isWhileToken = (token: AST.Token): boolean => token.value === 'while';
      
      const whileToken = sourceCode.getTokenAfter(node.body, isWhileToken);
      if(whileToken != null) checkNewlineBefore(node, whileToken, node);
    };
    
    return {
      // if・else if・else
      IfStatement: handleIfStatement,
      // else (非 IfStatement の alternate) : alternate が BlockStatement や ExpressionStatement の場合
      'IfStatement:exit': handleIfStatementExit,  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
      // catch
      CatchClause: handleCatchClause,
      // finally
      TryStatement: handleTryStatement,
      // do while
      DoWhileStatement: handleDoWhileStatement
    };
  }
};
