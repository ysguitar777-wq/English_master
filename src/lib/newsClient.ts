// ニュース記事取得クライアント
// NewsAPI.org の everything エンドポイントを使う。
// レート制限や仕様変更に備えて取得処理をこのファイルに分離してあり、
// 将来 GNews.io / NewsData.io などに切り替える場合は
// fetchArticles() の中身だけ書き換えれば他のコードは変更不要。

export type Article = {
  title: string;
  description: string | null;
  content: string | null; // NewsAPI無料枠では本文は先頭200文字程度に切り詰められる
  url: string;
  sourceName: string;
  publishedAt: string;
};

export type NewsSearchParams = {
  query: string; // キーワード。"React AND performance" のようなブール演算も可
  fromDaysAgo?: number; // 何日前から取得するか(デフォルト14日=2週間)
};

export class NewsClientError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "NewsClientError";
  }
}

export async function fetchArticles(params: NewsSearchParams): Promise<Article[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) {
    throw new NewsClientError(
      "NEWSAPI_KEY が設定されていません。.env に NEWSAPI_KEY=... を追加してください(https://newsapi.org で無料取得できます)。"
    );
  }

  const from = new Date();
  from.setDate(from.getDate() - (params.fromDaysAgo ?? 14));

  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", params.query);
  url.searchParams.set("from", from.toISOString().slice(0, 10)); // ISO 8601 (YYYY-MM-DD)
  url.searchParams.set("language", "en"); // 英語記事のみ
  url.searchParams.set("sortBy", "publishedAt"); // 新しい順
  url.searchParams.set("pageSize", "20");

  const res = await fetch(url.toString(), {
    headers: { "X-Api-Key": apiKey },
    // NewsAPI無料枠は1日100リクエスト程度。同一検索は10分キャッシュして節約する
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      body?.message ??
      (res.status === 429
        ? "NewsAPIのレート制限に達しました。しばらく待ってから再試行してください。"
        : `NewsAPIエラー (HTTP ${res.status})`);
    throw new NewsClientError(message, res.status);
  }

  // NewsAPIのレスポンス型(必要なフィールドのみ定義)
  type RawArticle = {
    title: string | null;
    description: string | null;
    content: string | null;
    url: string;
    source: { name: string | null } | null;
    publishedAt: string;
  };
  const data: { articles?: RawArticle[] } = await res.json();
  return (data.articles ?? [])
    .filter((a) => a.title && a.title !== "[Removed]")
    .map(
      (a): Article => ({
        title: a.title!,
        description: a.description,
        content: a.content,
        url: a.url,
        sourceName: a.source?.name ?? "Unknown",
        publishedAt: a.publishedAt,
      })
    );
}
