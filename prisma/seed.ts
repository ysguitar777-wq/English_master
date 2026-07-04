// シードスクリプト — `npx prisma db seed` で実行される(package.jsonの"prisma"."seed"で設定)
// 初期データとしてプログラミング頻出英単語・フレーズを投入する
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedWord = {
  term: string;
  meaning: string;
  example?: string;
  category: "general" | "programming" | "git" | "error" | "comment";
};

const words: SeedWord[] = [
  // ===== 一般IT用語 (general) =====
  { term: "implement", meaning: "実装する", example: "We need to implement the login feature.", category: "general" },
  { term: "deprecated", meaning: "非推奨の(将来削除予定)", example: "This API is deprecated; use v2 instead.", category: "general" },
  { term: "dependency", meaning: "依存関係、依存ライブラリ", example: "Run npm install to install dependencies.", category: "general" },
  { term: "configuration", meaning: "設定、構成", example: "Check the configuration file for details.", category: "general" },
  { term: "authentication", meaning: "認証(本人確認)", example: "Authentication failed: invalid password.", category: "general" },
  { term: "authorization", meaning: "認可(権限確認)", example: "You need authorization to access this resource.", category: "general" },
  { term: "asynchronous", meaning: "非同期の", example: "JavaScript handles asynchronous operations with promises.", category: "general" },
  { term: "concurrency", meaning: "並行性、同時実行", example: "Concurrency bugs are hard to reproduce.", category: "general" },
  { term: "scalability", meaning: "拡張性、スケーラビリティ", example: "We designed the system for scalability.", category: "general" },
  { term: "latency", meaning: "遅延、待ち時間", example: "The API has high latency under load.", category: "general" },
  { term: "throughput", meaning: "処理能力、スループット", example: "The new server doubled our throughput.", category: "general" },
  { term: "middleware", meaning: "ミドルウェア(中間処理)", example: "Add logging middleware to the request pipeline.", category: "general" },
  { term: "endpoint", meaning: "エンドポイント(APIの接続先)", example: "Call the /users endpoint to fetch user data.", category: "general" },
  { term: "payload", meaning: "ペイロード(送信データ本体)", example: "The request payload must be valid JSON.", category: "general" },
  { term: "schema", meaning: "スキーマ(データ構造の定義)", example: "Update the database schema before deploying.", category: "general" },
  { term: "migration", meaning: "マイグレーション(DB構造の移行)", example: "Run the migration to add the new column.", category: "general" },
  { term: "deployment", meaning: "デプロイ、本番反映", example: "The deployment to production succeeded.", category: "general" },
  { term: "rollback", meaning: "ロールバック(前の状態に戻す)", example: "We had to rollback the release due to a bug.", category: "general" },
  { term: "backward compatible", meaning: "後方互換性のある", example: "The new version is backward compatible with v1.", category: "general" },
  { term: "boilerplate", meaning: "定型コード、ひな形", example: "This framework reduces boilerplate code.", category: "general" },
  { term: "refactor", meaning: "リファクタリングする(動作を変えず整理)", example: "Let's refactor this function to improve readability.", category: "general" },
  { term: "workaround", meaning: "回避策、応急処置", example: "There is a workaround for this known issue.", category: "general" },
  { term: "edge case", meaning: "エッジケース(極端な条件の例外的ケース)", example: "This test covers the edge case of an empty list.", category: "general" },
  { term: "trade-off", meaning: "トレードオフ(何かを得ると何かを失う関係)", example: "There is a trade-off between speed and memory.", category: "general" },
  { term: "overhead", meaning: "オーバーヘッド(付随する余分なコスト)", example: "Serialization adds some overhead.", category: "general" },
  { term: "granularity", meaning: "粒度(細かさの度合い)", example: "Choose the right granularity for your logs.", category: "general" },
  { term: "idempotent", meaning: "冪等な(何度実行しても結果が同じ)", example: "PUT requests should be idempotent.", category: "general" },
  { term: "instantiate", meaning: "インスタンス化する(クラスから実体を作る)", example: "Instantiate the class before calling its methods.", category: "general" },
  { term: "encapsulation", meaning: "カプセル化(内部を隠蔽すること)", example: "Encapsulation hides internal implementation details.", category: "general" },
  { term: "inheritance", meaning: "継承(親クラスの機能を引き継ぐ)", example: "Prefer composition over inheritance.", category: "general" },
  { term: "polymorphism", meaning: "ポリモーフィズム、多態性", example: "Polymorphism lets you treat different types uniformly.", category: "general" },
  { term: "recursion", meaning: "再帰(自分自身を呼び出す処理)", example: "This tree traversal uses recursion.", category: "general" },
  { term: "immutable", meaning: "不変の(変更できない)", example: "Strings are immutable in JavaScript.", category: "general" },
  { term: "persistence", meaning: "永続化(データを保存し続けること)", example: "We use SQLite for data persistence.", category: "general" },
  { term: "serialization", meaning: "シリアライズ(データを保存・転送可能な形式に変換)", example: "JSON serialization is built into most languages.", category: "general" },
  { term: "validation", meaning: "検証、入力チェック", example: "Add validation for the email field.", category: "general" },
  { term: "sanitize", meaning: "サニタイズする(危険な入力を無害化)", example: "Always sanitize user input to prevent XSS.", category: "general" },
  { term: "vulnerability", meaning: "脆弱性", example: "A security vulnerability was found in the library.", category: "general" },
  { term: "obsolete", meaning: "廃止された、時代遅れの", example: "This documentation is obsolete.", category: "general" },
  { term: "verbose", meaning: "冗長な、詳細な(ログなど)", example: "Enable verbose logging for debugging.", category: "general" },

  // ===== プログラミング基本 (programming) =====
  { term: "function", meaning: "関数", example: "Define a function that returns the sum.", category: "programming" },
  { term: "variable", meaning: "変数", example: "Declare a variable to store the result.", category: "programming" },
  { term: "argument", meaning: "引数(関数に渡す値)", example: "This function takes two arguments.", category: "programming" },
  { term: "parameter", meaning: "パラメータ(関数が受け取る変数)", example: "The second parameter is optional.", category: "programming" },
  { term: "return value", meaning: "戻り値", example: "Check the return value for errors.", category: "programming" },
  { term: "statement", meaning: "文(プログラムの実行単位)", example: "An if statement controls the flow.", category: "programming" },
  { term: "expression", meaning: "式(値を生み出すコード)", example: "This expression evaluates to true.", category: "programming" },
  { term: "iterate", meaning: "反復する、繰り返し処理する", example: "Iterate over the array with a for loop.", category: "programming" },
  { term: "invoke", meaning: "呼び出す(関数などを)", example: "Invoke the callback when the data is ready.", category: "programming" },
  { term: "assign", meaning: "代入する", example: "Assign the value to a constant.", category: "programming" },
  { term: "declare", meaning: "宣言する", example: "Declare the type before using it.", category: "programming" },
  { term: "initialize", meaning: "初期化する", example: "Initialize the counter to zero.", category: "programming" },
  { term: "concatenate", meaning: "連結する(文字列など)", example: "Concatenate the first and last names.", category: "programming" },
  { term: "parse", meaning: "解析する、パースする", example: "Parse the JSON response into an object.", category: "programming" },
  { term: "compile", meaning: "コンパイルする", example: "The code failed to compile.", category: "programming" },
  { term: "execute", meaning: "実行する", example: "Execute the script from the command line.", category: "programming" },
  { term: "terminate", meaning: "終了する、終了させる", example: "The process terminated unexpectedly.", category: "programming" },
  { term: "increment", meaning: "1増やす、増分", example: "Increment the index after each loop.", category: "programming" },
  { term: "truncate", meaning: "切り詰める", example: "Truncate the string to 100 characters.", category: "programming" },
  { term: "delimiter", meaning: "区切り文字", example: "Use a comma as the delimiter.", category: "programming" },

  // ===== Git/GitHub用語 (git) =====
  { term: "pull request", meaning: "プルリクエスト(変更の取り込み依頼)", example: "Open a pull request when the feature is ready.", category: "git" },
  { term: "merge conflict", meaning: "マージコンフリクト(変更の衝突)", example: "Resolve the merge conflict before merging.", category: "git" },
  { term: "commit", meaning: "コミット(変更の記録)", example: "Commit your changes with a clear message.", category: "git" },
  { term: "branch", meaning: "ブランチ(作業の分岐)", example: "Create a new branch for this feature.", category: "git" },
  { term: "repository", meaning: "リポジトリ(コードの保管場所)", example: "Clone the repository to your local machine.", category: "git" },
  { term: "fork", meaning: "フォーク(リポジトリの複製)", example: "Fork the repo and submit a pull request.", category: "git" },
  { term: "rebase", meaning: "リベース(履歴の付け替え)", example: "Rebase your branch onto main.", category: "git" },
  { term: "squash", meaning: "スカッシュ(複数コミットを1つにまとめる)", example: "Squash the commits before merging.", category: "git" },
  { term: "cherry-pick", meaning: "チェリーピック(特定コミットだけ取り込む)", example: "Cherry-pick the hotfix commit to the release branch.", category: "git" },
  { term: "upstream", meaning: "上流(フォーク元・追跡先のリポジトリ)", example: "Fetch the latest changes from upstream.", category: "git" },
  { term: "stash", meaning: "スタッシュ(変更の一時退避)", example: "Stash your changes before switching branches.", category: "git" },
  { term: "diff", meaning: "差分", example: "Review the diff before committing.", category: "git" },
  { term: "revert", meaning: "取り消す(打ち消しコミットを作る)", example: "Revert the commit that broke the build.", category: "git" },
  { term: "amend", meaning: "修正する(直前のコミットを)", example: "Amend the commit to fix the typo in the message.", category: "git" },

  // ===== エラーメッセージ系表現 (error) =====
  { term: "throw an exception", meaning: "例外を投げる(発生させる)", example: "The function throws an exception on invalid input.", category: "error" },
  { term: "null pointer", meaning: "ヌルポインタ(無効な参照)", example: "A null pointer caused the crash.", category: "error" },
  { term: "undefined is not a function", meaning: "undefinedは関数ではない(JSの典型エラー)", example: "TypeError: undefined is not a function.", category: "error" },
  { term: "permission denied", meaning: "権限がありません", example: "bash: ./run.sh: Permission denied.", category: "error" },
  { term: "out of memory", meaning: "メモリ不足", example: "The process was killed: out of memory.", category: "error" },
  { term: "stack overflow", meaning: "スタックオーバーフロー(再帰しすぎ等)", example: "Infinite recursion causes a stack overflow.", category: "error" },
  { term: "segmentation fault", meaning: "セグメンテーション違反(不正メモリアクセス)", example: "The C program crashed with a segmentation fault.", category: "error" },
  { term: "connection refused", meaning: "接続が拒否されました", example: "Error: connect ECONNREFUSED 127.0.0.1:3000.", category: "error" },
  { term: "timeout exceeded", meaning: "タイムアウト超過", example: "Request failed: timeout exceeded.", category: "error" },
  { term: "unexpected token", meaning: "予期しないトークン(構文エラー)", example: "SyntaxError: Unexpected token '}'.", category: "error" },
  { term: "is not defined", meaning: "〜が定義されていません", example: "ReferenceError: foo is not defined.", category: "error" },
  { term: "failed to fetch", meaning: "取得に失敗しました(通信エラー)", example: "TypeError: Failed to fetch.", category: "error" },
  { term: "deprecated warning", meaning: "非推奨の警告", example: "DeprecationWarning: this method will be removed.", category: "error" },
  { term: "assertion failed", meaning: "アサーション失敗(前提条件が不成立)", example: "Assertion failed: expected 3 but got 4.", category: "error" },

  // ===== コードコメント・ドキュメント表現 (comment) =====
  { term: "TODO", meaning: "あとでやる(未実装の印)", example: "// TODO: handle the error case", category: "comment" },
  { term: "FIXME", meaning: "要修正(既知の問題の印)", example: "// FIXME: this breaks when the list is empty", category: "comment" },
  { term: "Note that ...", meaning: "〜に注意してください", example: "Note that this API requires authentication.", category: "comment" },
  { term: "for the sake of", meaning: "〜のために", example: "For the sake of simplicity, we omit error handling.", category: "comment" },
  { term: "as of", meaning: "〜時点で", example: "As of version 2.0, this option is removed.", category: "comment" },
  { term: "under the hood", meaning: "内部では、裏側では", example: "Under the hood, it uses a binary search.", category: "comment" },
  { term: "out of the box", meaning: "設定なしですぐ使える", example: "TypeScript support works out of the box.", category: "comment" },
  { term: "rule of thumb", meaning: "経験則、大まかな目安", example: "As a rule of thumb, keep functions under 50 lines.", category: "comment" },
  { term: "caveat", meaning: "注意点、ただし書き", example: "One caveat: this only works in Node 18+.", category: "comment" },
  { term: "prerequisite", meaning: "前提条件", example: "Node.js is a prerequisite for this tutorial.", category: "comment" },
  { term: "if applicable", meaning: "該当する場合は", example: "Include tests, if applicable.", category: "comment" },
  { term: "respectively", meaning: "それぞれ", example: "Set width and height to 100 and 50, respectively.", category: "comment" },
];

async function main() {
  const count = await prisma.word.count({ where: { source: "seed" } });
  if (count > 0) {
    console.log(`Seed already applied (${count} words). Skipping.`);
    return;
  }
  // createMany: 複数レコードを1回のクエリでまとめてINSERTする
  await prisma.word.createMany({
    data: words.map((w) => ({ ...w, source: "seed" })),
  });
  console.log(`Seeded ${words.length} words.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
