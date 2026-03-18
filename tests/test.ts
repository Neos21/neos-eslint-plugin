import fs from 'node:fs';
import childProcess from 'node:child_process';

/** テスト用に誤った書き方をしているテキスト */
const testFile = `
/** テストファイル */
const test = () => {
  // 以下の行には: 本来2スペースインデントが必要です

  /**
   * 以下のドキュメンテーションコメント行の行末には本来スペースが必要です
   *
   * @return なし
   */
  const testFunction = () => {
    const condition = null;
    if (condition === true) {
      console.log('True');
    } else if (condition === false) {
      console.log('False');
    } else {
      console.log('Unknown');
      // 以下の終了ブレースの次の行は本来4スペースインデントが必要です
    }

    if (condition) console.log('Truthy');
    else if (condition == null) console.log('Null');
    else console.log('Unknown');

    for (let i = 0; i < 5; i++) {
      try {
        i++;
      } catch (error) {
        console.log('Error');
      } finally {
        console.log('Finally');
      }
    }

    const text = 'Text';
    switch (text) {
      case 'Text':
        console.log('Text');
        break;
      default:
        console.log('Default');
    }

    let j = 0;
    do {
      j++;
    } while (j < 5);
  };

  testFunction();
};

test();
`;

/** 修正後のあるべき姿 */
const expected = `
/** テストファイル */
const test = () => {
  // 以下の行には : 本来2スペースインデントが必要です
  
  /**
   * 以下のドキュメンテーションコメント行の行末には本来スペースが必要です
   * 
   * @return なし
   */
  const testFunction = () => {
    const condition = null;
    if(condition === true) {
      console.log('True');
    }
    else if(condition === false) {
      console.log('False');
    }
    else {
      console.log('Unknown');
      // 以下の終了ブレースの次の行は本来4スペースインデントが必要です
    }
    
    if(condition) console.log('Truthy');
    else if(condition == null) console.log('Null');
    else console.log('Unknown');
    
    for(let i = 0; i < 5; i++) {
      try {
        i++;
      }
      catch(error) {
        console.log('Error');
      }
      finally {
        console.log('Finally');
      }
    }
    
    const text = 'Text';
    switch(text) {
      case 'Text':
        console.log('Text');
        break;
      default:
        console.log('Default');
    }
    
    let j = 0;
    do {
      j++;
    }
    while(j < 5);
  };
  
  testFunction();
};

test();
`;

/** テスト用ファイルパス */
const testFilePath = './tests/test-file.ts';
/** ESLint コマンド */
const eslintCommand = `npm run eslint -- --config ./tests/eslint.config.ts ${testFilePath}`;

// テスト用ファイルを書き出す
fs.writeFileSync(testFilePath, testFile, 'utf-8');
// エラー箇所を表示のみする
try {
  childProcess.execSync(eslintCommand);
}
catch(error) {
  console.error((error as { stdout: string; }).stdout.toString());
}
// Auto Fix する
console.log(childProcess.execSync(`${eslintCommand} --fix`).toString());
// 変更されたテスト用ファイルの内容が期待値と一致するか確認する
const afterFile = fs.readFileSync(testFilePath, 'utf-8');
console.log(afterFile === expected ? 'OK!' : 'NG!');
