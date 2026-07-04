// GET /api/news?q=キーワード&days=14 — NewsAPIから英語記事を検索
// APIキーをブラウザに晒さないよう、サーバー側(このAPI route)経由で呼び出す
import { NextRequest, NextResponse } from "next/server";
import { fetchArticles, NewsClientError } from "@/lib/newsClient";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const days = Number(req.nextUrl.searchParams.get("days") ?? 14);
  if (!q) {
    return NextResponse.json({ error: "q parameter is required" }, { status: 400 });
  }

  try {
    const articles = await fetchArticles({ query: q, fromDaysAgo: days });
    return NextResponse.json({ articles });
  } catch (e) {
    if (e instanceof NewsClientError) {
      return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
    }
    console.error(e);
    return NextResponse.json({ error: "記事の取得に失敗しました" }, { status: 500 });
  }
}
