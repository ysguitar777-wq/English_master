// 簡易辞書モジュール
// 外部APIを呼ばず、静的な単語リスト+語形変化の吸収(簡易ステミング)で意味を返す。
// 将来辞書APIに差し替える場合は lookup() の中身を置き換えるだけでよいよう、
// インターフェース(引数・戻り値の型)を固定してある。

export type DictEntry = { term: string; meaning: string };

// 一般的な機能語(冠詞・前置詞・代名詞など)。
// 「AIなし語彙抽出」でこれらを除外し、意味のある単語だけを拾うために使う。
export const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "then", "else", "when", "while",
  "of", "at", "by", "for", "with", "about", "against", "between", "into",
  "through", "during", "before", "after", "above", "below", "to", "from", "up",
  "down", "in", "out", "on", "off", "over", "under", "again", "further",
  "once", "here", "there", "all", "any", "both", "each", "few", "more", "most",
  "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so",
  "than", "too", "very", "can", "will", "just", "should", "would", "could",
  "may", "might", "must", "shall", "i", "me", "my", "myself", "we", "our",
  "ours", "you", "your", "yours", "he", "him", "his", "she", "her", "hers",
  "it", "its", "they", "them", "their", "what", "which", "who", "whom",
  "this", "that", "these", "those", "am", "is", "are", "was", "were", "be",
  "been", "being", "have", "has", "had", "having", "do", "does", "did",
  "doing", "as", "until", "because", "how", "why", "where", "also", "however",
  "although", "though", "since", "yet", "still", "even", "much", "many",
  "get", "got", "make", "made", "like", "one", "two", "new", "now", "said",
  "says", "say", "us", "per", "via", "etc", "ie", "eg",
]);

// 静的辞書(頻出の一般語+技術関連語)。readerのタップ時に参照する。
const STATIC_DICT: Record<string, string> = {
  ability: "能力", access: "アクセス、利用権限", account: "アカウント、口座",
  achieve: "達成する", actually: "実際には", add: "追加する",
  address: "住所、対処する", advantage: "利点", affect: "影響を与える",
  agree: "同意する", allow: "許可する", already: "すでに",
  always: "いつも", amount: "量", announce: "発表する",
  annual: "年次の", appear: "現れる、〜のように見える", application: "アプリケーション、応用",
  apply: "適用する、応募する", approach: "手法、近づく", appropriate: "適切な",
  area: "領域、分野", article: "記事", ask: "尋ねる、頼む",
  attack: "攻撃", attempt: "試み、試みる", available: "利用可能な",
  average: "平均", avoid: "避ける", aware: "気づいている",
  become: "〜になる", begin: "始める", behavior: "振る舞い、挙動",
  believe: "信じる、考える", benefit: "利益、恩恵", better: "より良い",
  billion: "10億", block: "ブロックする、塊", both: "両方",
  browser: "ブラウザ", build: "構築する、ビルド", business: "ビジネス、事業",
  button: "ボタン", call: "呼ぶ、呼び出す", capability: "能力、機能",
  case: "場合、事例", cause: "原因、引き起こす", certain: "特定の、確実な",
  challenge: "課題、挑戦", change: "変更、変える", check: "確認する",
  choice: "選択", choose: "選ぶ", claim: "主張する",
  clear: "明確な、消去する", client: "クライアント、顧客", code: "コード",
  command: "コマンド、命令", common: "一般的な、共通の", company: "会社",
  compare: "比較する", complete: "完了する、完全な", complex: "複雑な",
  component: "部品、コンポーネント", computer: "コンピュータ", concern: "懸念",
  condition: "条件、状態", consider: "検討する、考慮する", contain: "含む",
  content: "内容、コンテンツ", continue: "続ける", control: "制御",
  cost: "コスト、費用", create: "作成する", current: "現在の",
  customer: "顧客", data: "データ", deal: "取引、扱う",
  decide: "決定する", decision: "決定", decrease: "減少する",
  default: "デフォルト、既定値", define: "定義する", deliver: "届ける、提供する",
  demand: "需要、要求", describe: "説明する、記述する", design: "設計",
  detail: "詳細", determine: "決定する、特定する", develop: "開発する",
  developer: "開発者", device: "デバイス、機器", difference: "違い",
  different: "異なる", difficult: "難しい", discover: "発見する",
  discuss: "議論する", display: "表示する", document: "文書、ドキュメント",
  download: "ダウンロードする", drive: "駆動する、推進する",
  early: "早い、初期の", easily: "簡単に", effect: "効果、影響",
  effective: "効果的な", effort: "努力、取り組み", either: "どちらか",
  emerge: "現れる", employee: "従業員", enable: "有効にする、可能にする",
  encourage: "促す、奨励する", enough: "十分な", ensure: "保証する、確実にする",
  enterprise: "企業", entire: "全体の", environment: "環境",
  error: "エラー、誤り", especially: "特に", establish: "確立する",
  estimate: "見積もる", event: "イベント、出来事", eventually: "最終的に",
  evidence: "証拠", exactly: "正確に", example: "例",
  execute: "実行する", exist: "存在する", expect: "期待する、予想する",
  experience: "経験", explain: "説明する", express: "表現する",
  extend: "拡張する", feature: "機能、特徴", field: "分野、フィールド",
  figure: "図、数値", file: "ファイル", finally: "最終的に",
  find: "見つける", firm: "会社、企業", focus: "焦点、集中する",
  follow: "従う、続く", following: "次の、以下の", force: "強制する、力",
  form: "形式、フォーム", former: "以前の、前者の", forward: "前方へ、転送する",
  foundation: "基盤、財団", framework: "フレームワーク、枠組み", free: "無料の、自由な",
  frequently: "頻繁に", further: "さらに", future: "未来、将来の",
  general: "一般的な", generate: "生成する", global: "世界的な、グローバルな",
  goal: "目標", government: "政府", growth: "成長",
  guide: "案内、ガイド", handle: "処理する、扱う", happen: "起こる",
  hardware: "ハードウェア", help: "助ける", hide: "隠す",
  history: "履歴、歴史", huge: "巨大な", human: "人間",
  idea: "アイデア、考え", identify: "特定する", image: "画像",
  impact: "影響", important: "重要な", improve: "改善する",
  include: "含む", increase: "増加する", indeed: "実際に",
  indicate: "示す", industry: "産業、業界", information: "情報",
  input: "入力", inside: "内側", install: "インストールする",
  instance: "インスタンス、実例", instead: "代わりに", intelligence: "知能",
  interest: "興味、利益", interface: "インターフェース", internal: "内部の",
  introduce: "導入する、紹介する", issue: "問題、課題", item: "項目",
  join: "参加する、結合する", key: "鍵、重要な", knowledge: "知識",
  language: "言語", large: "大きい", largest: "最大の",
  late: "遅い", latest: "最新の", launch: "開始する、公開する",
  lead: "導く、主要な", learn: "学ぶ", least: "最小の",
  less: "より少ない", level: "レベル、水準", library: "ライブラリ、図書館",
  likely: "〜しそうな、おそらく", limit: "制限", line: "行、線",
  link: "リンク", list: "一覧、リスト", load: "読み込む、負荷",
  local: "ローカルの、地域の", look: "見る", machine: "機械、マシン",
  main: "主要な", maintain: "維持する、保守する", major: "主要な",
  manage: "管理する", management: "管理、経営", market: "市場",
  matter: "問題、重要である", mean: "意味する", measure: "測定する、対策",
  meet: "会う、満たす", member: "メンバー", memory: "メモリ、記憶",
  mention: "言及する", message: "メッセージ", method: "方法、メソッド",
  million: "100万", mind: "心、気にする", mobile: "モバイル",
  model: "モデル", modern: "現代の", modify: "修正する、変更する",
  moment: "瞬間", money: "お金", month: "月",
  move: "動かす、移動する", multiple: "複数の", nearly: "ほぼ",
  necessary: "必要な", need: "必要とする", network: "ネットワーク",
  never: "決して〜ない", next: "次の", notice: "気づく、通知",
  number: "数、番号", object: "オブジェクト、物体", offer: "提供する",
  official: "公式の", often: "しばしば", open: "開く、オープンな",
  operate: "操作する、運用する", operation: "操作、運用", opportunity: "機会",
  option: "選択肢、オプション", order: "順序、注文", organization: "組織",
  original: "元の、独自の", others: "他のもの", otherwise: "そうでなければ",
  output: "出力", outside: "外側", overall: "全体的な",
  page: "ページ", particular: "特定の", partner: "パートナー",
  password: "パスワード", pattern: "パターン", people: "人々",
  percent: "パーセント", perform: "実行する", performance: "性能、パフォーマンス",
  perhaps: "おそらく", period: "期間", personal: "個人の",
  phone: "電話", place: "場所、置く", plan: "計画",
  platform: "プラットフォーム", point: "点、指し示す", policy: "方針、ポリシー",
  popular: "人気のある", position: "位置、立場", possible: "可能な",
  power: "力、電力", powerful: "強力な", practice: "実践、慣行",
  present: "提示する、現在の", press: "押す、報道", prevent: "防ぐ",
  previous: "以前の", price: "価格", private: "非公開の、私的な",
  probably: "おそらく", problem: "問題", process: "処理、プロセス",
  produce: "生産する", product: "製品", program: "プログラム",
  project: "プロジェクト", promise: "約束(JSではPromiseオブジェクト)", protect: "保護する",
  prove: "証明する", provide: "提供する", public: "公開の、公共の",
  purpose: "目的", quality: "品質", question: "質問",
  quickly: "素早く", quite: "かなり", raise: "上げる、提起する",
  range: "範囲", rate: "割合、レート", rather: "むしろ",
  reach: "到達する", read: "読む", ready: "準備ができた",
  real: "本物の、実際の", really: "本当に", reason: "理由",
  receive: "受け取る", recent: "最近の", recently: "最近",
  record: "記録", reduce: "減らす", refer: "参照する",
  regard: "みなす", region: "地域、リージョン", release: "リリース、公開する",
  remain: "残る、〜のままである", remember: "覚えている", remove: "削除する",
  replace: "置き換える", report: "報告、レポート", represent: "表す",
  request: "要求、リクエスト", require: "必要とする", research: "研究、調査",
  resource: "リソース、資源", respond: "応答する", response: "応答、レスポンス",
  rest: "残り、休憩", result: "結果", return: "返す、戻る",
  reveal: "明らかにする", review: "レビュー、確認する", right: "右、正しい、権利",
  rise: "上昇する", risk: "リスク", role: "役割",
  rule: "ルール、規則", run: "実行する、走る", save: "保存する",
  scale: "規模、拡大縮小する", screen: "画面", search: "検索する",
  section: "セクション、部分", secure: "安全な、確保する", security: "セキュリティ",
  seem: "〜のように見える", select: "選択する", sell: "売る",
  send: "送る", sense: "感覚、意味", series: "一連、シリーズ",
  serious: "深刻な、真剣な", serve: "提供する、仕える", server: "サーバー",
  service: "サービス", set: "設定する、集合", settings: "設定",
  several: "いくつかの", share: "共有する、株", show: "見せる、示す",
  sign: "署名する、兆候", significant: "重要な、著しい", similar: "類似の",
  simple: "単純な", simply: "単に", single: "単一の",
  site: "サイト", situation: "状況", size: "サイズ、大きさ",
  small: "小さい", social: "社会の、ソーシャル", software: "ソフトウェア",
  solution: "解決策、ソリューション", solve: "解決する", source: "ソース、情報源",
  space: "空間、スペース", special: "特別な", specific: "特定の、具体的な",
  speed: "速度", spend: "費やす", standard: "標準",
  start: "開始する", state: "状態、述べる", statement: "声明、文",
  step: "手順、段階", storage: "ストレージ、保存領域", store: "保存する、店",
  strategy: "戦略", strong: "強い", structure: "構造",
  study: "研究、勉強する", stuff: "もの、こと", subject: "主題、対象",
  submit: "送信する、提出する", success: "成功", successful: "成功した",
  suggest: "提案する、示唆する", support: "サポート、支援する", sure: "確かな",
  surface: "表面、表面化する", system: "システム", table: "表、テーブル",
  take: "取る", talk: "話す", target: "目標、対象",
  task: "タスク、作業", team: "チーム", technology: "技術",
  tend: "傾向がある", term: "用語、期間", test: "テスト",
  text: "テキスト、文章", together: "一緒に", tool: "ツール、道具",
  toward: "〜に向かって", track: "追跡する", traditional: "従来の、伝統的な",
  train: "訓練する、学習させる", trust: "信頼", try: "試す",
  turn: "回転する、順番", type: "型、種類", understand: "理解する",
  unit: "単位、ユニット", unless: "〜でない限り", update: "更新する",
  upgrade: "アップグレードする", upload: "アップロードする", usage: "使用法、使用量",
  useful: "役に立つ", user: "ユーザー", usually: "通常",
  value: "値、価値", version: "バージョン", view: "表示、見解",
  wait: "待つ", want: "欲しい", warn: "警告する",
  watch: "見る、監視する", way: "方法、道", website: "ウェブサイト",
  week: "週", whether: "〜かどうか", whole: "全体の",
  wide: "広い", widely: "広く", within: "〜以内に",
  without: "〜なしで", word: "単語", work: "動作する、仕事",
  world: "世界", write: "書く", wrong: "間違った",
  year: "年", yield: "生み出す、譲る",
};

// 語形変化を吸収する簡易ステミング: looked → look, running → run, apis → api
function candidates(raw: string): string[] {
  const w = raw.toLowerCase();
  const list = [w];
  if (w.endsWith("ies")) list.push(w.slice(0, -3) + "y");
  if (w.endsWith("es")) list.push(w.slice(0, -2));
  if (w.endsWith("s")) list.push(w.slice(0, -1));
  if (w.endsWith("ied")) list.push(w.slice(0, -3) + "y");
  if (w.endsWith("ed")) list.push(w.slice(0, -2), w.slice(0, -1)); // moved→move
  if (w.endsWith("ing")) {
    list.push(w.slice(0, -3), w.slice(0, -3) + "e"); // making→make
    if (w.length > 5 && w[w.length - 4] === w[w.length - 5]) {
      list.push(w.slice(0, -4)); // running→run
    }
  }
  if (w.endsWith("ly")) list.push(w.slice(0, -2));
  if (w.endsWith("er")) list.push(w.slice(0, -2), w.slice(0, -1));
  if (w.endsWith("est")) list.push(w.slice(0, -3));
  return list;
}

/**
 * 単語の意味を静的辞書から引く。見つからなければnull。
 * 将来辞書APIに差し替える場合はこの関数をasyncにしてAPI呼び出しに置き換える。
 */
export function lookup(word: string): DictEntry | null {
  for (const c of candidates(word)) {
    if (STATIC_DICT[c]) return { term: c, meaning: STATIC_DICT[c] };
  }
  return null;
}

export function isStopWord(word: string): boolean {
  return STOP_WORDS.has(word.toLowerCase());
}
