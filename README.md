# English Master 📖

英語のWebサイト・技術記事を読めるようになるための個人用学習アプリ。
プログラミング頻出英単語のフラッシュカード(間隔反復)、単語タップ辞書つき記事リーダー、
最新英語記事の自動取得&問題生成、学習履歴ダッシュボードを備えています。

## 技術スタック

- Next.js (App Router, TypeScript)
- Prisma + SQLite(学習データはローカルの `prisma/dev.db` に保存)
- Tailwind CSS

## セットアップ

```bash
# 1. 依存関係のインストール
npm install

# 2. 環境変数ファイルを作成(APIキーは後述)
cp .env.example .env

# 3. DBの作成(マイグレーション)+ 初期データ投入(プログラミング英単語100語)
npm run db:setup

# 4. 開発サーバー起動
npm run dev
```

`npm run db:setup` の内訳:

- `prisma migrate dev` — `prisma/schema.prisma` の定義からSQLをつくり、SQLite DB(`prisma/dev.db`)に適用。同時に型安全なPrisma Client(`@prisma/client`)を自動生成
- `prisma db seed` — `prisma/seed.ts` を実行してプログラミング頻出英単語100語を投入

## iPhoneからのアクセス方法

1. PCとiPhoneを**同じWi-Fi**に接続する
2. PCのLAN IPアドレスを確認する
   - Mac: `ipconfig getifaddr en0`
   - Windows: `ipconfig`(「IPv4 アドレス」の欄)
   - Linux: `hostname -I`
3. `npm run dev` でサーバーを起動(`-H 0.0.0.0` 付きなのでLAN内から接続可能)
4. iPhoneのSafariで `http://<PCのIPアドレス>:3000` を開く
5. **ホーム画面に追加**(共有ボタン → ホーム画面に追加)すると、
   アプリのように全画面(standalone)で起動します

> ファイアウォールでポート3000がブロックされている場合は許可してください。

## APIキーの設定(`.env`)

| キー | 必須? | 用途 | 取得方法 |
|---|---|---|---|
| `NEWSAPI_KEY` | 記事取得機能を使うなら必須 | 「📰 記事取得」でのニュース検索 | [newsapi.org/register](https://newsapi.org/register) で無料登録 |
| `ANTHROPIC_API_KEY` | 任意 | 記事からのクイズ・語彙のAI生成 | [console.anthropic.com](https://console.anthropic.com)(従量課金) |

- **NewsAPI 無料枠の注意**: 開発用途のみ / 過去1ヶ月の記事 / 1日100リクエスト程度 / 記事の出典表示が必要(アプリ内で出典・元記事リンクを表示済み)
- **Anthropic APIキーがない場合**も問題生成は動きます(無料の簡易ロジック: 頻度ベースの語彙抽出+キーワード穴埋め問題)。キーを設定すると軽量モデル(Haiku)による読解4択クイズ+意味つき語彙抽出に自動で切り替わります

## 機能

| ページ | 内容 |
|---|---|
| 📊 ホーム | 日別復習数グラフ・正答率推移・わからなかった単語一覧・読書ログ |
| 🃏 カード | 間隔反復(簡易SM-2)によるフラッシュカード。○/✗で回答すると次回出題日が自動調整される |
| 📖 リーダー | 英文を貼り付けて表示。単語タップで意味ポップアップ+「わからなかった単語」登録(フラッシュカードに合流) |
| 📰 記事取得 | キーワード・期間を指定してNewsAPIから英語記事を検索 → 読解クイズ+語彙を自動生成 |

## ディレクトリ構成(主要部分)

```
prisma/
  schema.prisma      # DBテーブル定義(Word / ReviewLog / ReadingSession / Quiz)
  seed.ts            # プログラミング英単語100語の初期データ
src/
  app/
    page.tsx         # ダッシュボード
    flashcards/      # フラッシュカード
    reader/          # 記事リーダー
    news/            # 記事検索
    quiz/[id]/       # 読解クイズ受験
    api/             # DB操作・外部API呼び出し用のAPI route
  components/charts.tsx  # SVG棒グラフ・折れ線グラフ(ライブラリ不使用)
  lib/
    srs.ts           # 間隔反復(簡易SM-2)アルゴリズム
    dictionary.ts    # 静的辞書+ストップワード(将来辞書APIに差し替え可能)
    newsClient.ts    # NewsAPI呼び出し(GNews等に差し替えやすいよう分離)
    quizGen.ts       # 問題生成(AI経路/簡易ロジック経路の自動切替)
```

## よく使うコマンド

```bash
npm run dev          # 開発サーバー(LAN公開: -H 0.0.0.0)
npm run build        # 本番ビルド
npm run db:setup     # マイグレーション+シード
npx prisma studio    # DBの中身をブラウザで確認できるGUI
```
