# English Master 📖

英語のWebサイト・技術記事を読めるようになるための個人用学習アプリ。
プログラミング頻出英単語のフラッシュカード(間隔反復)、単語タップ辞書つき記事リーダー、
最新英語記事の自動取得&問題生成、学習履歴ダッシュボードを備えています。

## 技術スタック

- Next.js (App Router, TypeScript)
- Prisma + SQLite(学習データはローカルの `prisma/dev.db` に保存)
- Tailwind CSS

## 機能

| ページ | 内容 |
|---|---|
| 📊 ホーム | 日別復習数グラフ・正答率推移・わからなかった単語一覧・読書ログ |
| 🃏 カード | 間隔反復(簡易SM-2)によるフラッシュカード。○/✗で回答すると次回出題日が自動調整される |
| 📖 リーダー | 英文を貼り付けて表示。単語タップで意味ポップアップ+「わからなかった単語」登録(フラッシュカードに合流) |
| 📰 記事取得 | キーワード・期間を指定してNewsAPIから英語記事を検索 → 読解クイズ+語彙を自動生成 |

---

## セットアップ(PC / ラズパイ共通)

### 事前準備

- **Node.js 18以上(推奨20以上)** — [nodejs.org](https://nodejs.org/ja) のLTS版
- **Git**

確認:

```bash
node --version   # v20.x.x などが出ればOK
git --version
```

### インストール手順

```bash
# 1. リポジトリの取得
git clone https://github.com/ysguitar777-wq/English_master.git
cd English_master

# 2. 依存関係のインストール
npm install

# 3. 環境変数ファイルを作成(APIキーは後述)
cp .env.example .env        # Windowsの場合: copy .env.example .env

# 4. DBの作成(マイグレーション)+ 初期データ投入(プログラミング英単語100語)
npm run db:setup

# 5. 開発サーバー起動
npm run dev
```

`Ready` と表示されたら、ブラウザで http://localhost:3000 を開けば使えます。

`npm run db:setup` の内訳:

- `prisma migrate dev` — `prisma/schema.prisma` の定義からSQLをつくり、SQLite DB(`prisma/dev.db`)に適用。同時に型安全なPrisma Client(`@prisma/client`)を自動生成
- `prisma db seed` — `prisma/seed.ts` を実行してプログラミング頻出英単語100語を投入

### 2回目以降の起動

```bash
cd English_master
npm run dev
```

だけでOKです。学習データは `prisma/dev.db` にローカル保存されるので、サーバーを止めても消えません。

---

## iPhoneからのアクセス方法

1. サーバーを動かしているPC(またはラズパイ)とiPhoneを**同じWi-Fi**に接続する
2. PCのLAN IPアドレスを確認する
   - Mac: `ipconfig getifaddr en0`
   - Windows: `ipconfig`(「IPv4 アドレス」の欄、例: 192.168.1.5)
   - Linux/ラズパイ: `hostname -I`
3. `npm run dev` でサーバーを起動(`-H 0.0.0.0` 付きなのでLAN内から接続可能)
4. iPhoneのSafariで `http://<PCのIPアドレス>:3000` を開く
5. **ホーム画面に追加**(共有ボタン → ホーム画面に追加)すると、
   アプリのように全画面(standalone)で起動します

> ファイアウォールでポート3000がブロックされている場合は許可してください
> (Windowsは初回起動時に許可ダイアログが出るので「許可」を選択)。

---

## iPhoneからセットアップ・操作する方法(SSH)

PCの前に座らなくても、iPhoneからSSH接続すれば git clone〜起動まで全部iPhoneで実行できます。
**「SSHを受け付ける設定」だけは最初に1回だけサーバー側の実機で操作が必要**です。

### ステップ0: サーバー側でSSHを有効化(1回だけ実機で操作)

- **Mac**: システム設定 → 一般 → 共有 → 「リモートログイン」をオン
- **Windows**: 設定 → システム → オプション機能 → 機能の追加 →
  「OpenSSH サーバー」をインストール → サービスで「OpenSSH SSH Server」を開始(スタートアップの種類を「自動」に)
- **ラズパイ**: OS書き込み時にRaspberry Pi ImagerでSSHを有効化しておけば設定不要

### ステップ1: iPhoneにSSHアプリを入れて接続

1. App Storeで **Termius**(無料)をインストール
2. 新規ホストを追加: Hostname にサーバーのIP(例 `192.168.1.5`)、
   Username / Password にサーバーのログインユーザー名とパスワードを入力
3. 接続すると、iPhoneの画面にサーバーのターミナルが表示される

### ステップ2: iPhone上でセットアップを実行

上記「セットアップ」のコマンドをそのまま実行するだけです。

> **GitHub認証の注意**: git clone時にパスワードを求められた場合、GitHubのパスワードではなく
> **Personal Access Token** が必要です(github.com → Settings → Developer settings →
> Personal access tokens で作成してコピペ)。

Node.jsが未インストールの場合もSSH越しに入れられます:

- Mac(Homebrewあり): `brew install node git`
- Windows: `winget install OpenJS.NodeJS.LTS Git.Git`(実行後、一度切断→再接続でパスが通る)
- ラズパイ/Linux: 後述のラズパイの章を参照

### ステップ3: SSHを切ってもサーバーが止まらない起動方法

普通に `npm run dev` するとTermiusを閉じた時点でサーバーも止まるため、
バックグラウンド起動(`nohup`)がおすすめです:

```bash
nohup npm run dev > server.log 2>&1 &
```

止めたいときは同じくSSHから:

```bash
pkill -f "next dev"
```

---

## ラズパイ4(2GB)で動かす

ラズパイ4の2GBモデルで動作可能です。常時起動の小型サーバーとしてこのアプリの用途に最も向いています
(PCを点けっぱなしにする必要がなくなり、消費電力も数W程度)。

### 前提条件(重要)

**64bit版のRaspberry Pi OSを使ってください。**
このアプリが使うPrismaは32bit ARM(armv7)用のバイナリを提供していないため、32bit OSでは動きません。
Raspberry Pi Imagerで「Raspberry Pi OS **(64-bit)**」を選択します。
デスクトップ不要なら「Lite」版を選ぶとメモリの節約になります。

### 2GBメモリでの注意点と対策

**1. 開発モードではなく本番モードで動かす**

`npm run dev` はアクセスのたびにコンパイルが走りメモリを多く使うため、2GBでは重くなります。
一度ビルドして本番モードで起動してください:

```bash
npm run build    # 一度だけ実行(5〜15分かかる)
npm start        # 本番モードで起動(-H 0.0.0.0付きなのでLANからアクセス可)
```

本番モードの実行時メモリは200〜300MB程度なので2GBで余裕があります。
コードを変更しない限り再ビルドは不要です。

**2. ビルド前にスワップを増やしておく**

`npm run build` 中は一時的に1GB以上使うことがあり、2GB機ではメモリ不足で落ちる可能性があります:

```bash
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo systemctl restart dphys-swapfile
```

### ラズパイでのセットアップ全手順

SSH接続して(iPhoneのTermiusからでもOK):

```bash
# Node.js 20のインストール(OS標準のnodeは古いことが多いため)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# アプリのセットアップ
git clone https://github.com/ysguitar777-wq/English_master.git
cd English_master
npm install
cp .env.example .env
npm run db:setup
npm run build
npm start
```

iPhoneのSafariで `http://<ラズパイのIP>:3000` を開けば完成です。

---

## APIキーの設定(`.env`)

| キー | 必須? | 用途 | 取得方法 |
|---|---|---|---|
| `NEWSAPI_KEY` | 記事取得機能を使うなら必須 | 「📰 記事取得」でのニュース検索 | [newsapi.org/register](https://newsapi.org/register) で無料登録 |
| `ANTHROPIC_API_KEY` | 任意 | 記事からのクイズ・語彙のAI生成 | [console.anthropic.com](https://console.anthropic.com)(従量課金) |

- キーなしでも、フラッシュカード・記事リーダー・ダッシュボードは全部使えます
- **NewsAPI 無料枠の注意**: 開発用途のみ / 過去1ヶ月の記事 / 1日100リクエスト程度 / 記事の出典表示が必要(アプリ内で出典・元記事リンクを表示済み)
- **Anthropic APIキーがない場合**も問題生成は動きます(無料の簡易ロジック: 頻度ベースの語彙抽出+キーワード穴埋め問題)。キーを設定すると軽量モデル(Haiku)による読解4択クイズ+意味つき語彙抽出に自動で切り替わります

---

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
npm start            # 本番モードで起動(ラズパイ等の常時運用向け)
npm run db:setup     # マイグレーション+シード
npx prisma studio    # DBの中身をブラウザで確認できるGUI
```
