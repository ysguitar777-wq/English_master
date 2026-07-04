"use client";
// 最新記事の取得 → 問題化
// NewsAPI.orgでキーワード検索し、選んだ記事から読解クイズ+語彙を自動生成する
import { useState } from "react";
import { useRouter } from "next/navigation";

type Article = {
  title: string;
  description: string | null;
  content: string | null;
  url: string;
  sourceName: string;
  publishedAt: string;
};

export default function NewsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [days, setDays] = useState(14);
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null); // 生成中の記事URL
  const [error, setError] = useState<string | null>(null);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setArticles(null);
    try {
      const res = await fetch(
        `/api/news?q=${encodeURIComponent(query)}&days=${days}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "取得に失敗しました");
      setArticles(data.articles);
    } catch (e) {
      setError(e instanceof Error ? e.message : "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  // 記事本文として使えるテキストを組み立てる
  // NewsAPI無料枠のcontentは先頭200文字程度に切られるため、description等も連結する
  function articleText(a: Article): string {
    const parts = [a.description, a.content?.replace(/\[\+\d+ chars\]$/, "")];
    return parts.filter(Boolean).join("\n\n");
  }

  async function generateQuiz(a: Article) {
    setGenerating(a.url);
    setError(null);
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: a.title,
          url: a.url,
          sourceName: a.sourceName,
          text: `${a.title}\n\n${articleText(a)}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "問題の生成に失敗しました");
      router.push(`/quiz/${data.sessionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "問題の生成に失敗しました");
      setGenerating(null);
    }
  }

  function openInReader(a: Article) {
    sessionStorage.setItem(
      "reader-article",
      JSON.stringify({
        title: a.title,
        text: articleText(a),
        url: a.url,
        sourceName: a.sourceName,
      })
    );
    router.push("/reader");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">📰 最新記事から学ぶ</h1>
      <p className="text-sm text-slate-500">
        キーワードで直近の英語記事を検索し、読解クイズと語彙を自動生成します。
        (記事はNewsAPI.org経由で取得。出典は各記事に表示されます)
      </p>

      <div className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder='キーワード(例: React AND performance)'
          className="w-full rounded-xl border border-slate-200 p-3 text-sm"
        />
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <label htmlFor="days">期間:</label>
          <select
            id="days"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-slate-200 p-2"
          >
            <option value={3}>直近3日</option>
            <option value={7}>直近1週間</option>
            <option value={14}>直近2週間</option>
            <option value={28}>直近4週間</option>
          </select>
          <span className="text-xs text-slate-400">/ 英語・新しい順</span>
        </div>
        <button
          onClick={search}
          disabled={loading || !query.trim()}
          className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white active:bg-blue-700 disabled:opacity-40"
        >
          {loading ? "検索中..." : "記事を検索"}
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {articles && articles.length === 0 && (
        <p className="py-4 text-center text-sm text-slate-400">記事が見つかりませんでした。</p>
      )}

      {articles?.map((a) => (
        <article key={a.url} className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="font-semibold leading-snug">{a.title}</h2>
          {/* 出典表示(NewsAPI利用条件) */}
          <p className="text-xs text-slate-400">
            {a.sourceName} · {new Date(a.publishedAt).toLocaleDateString("ja-JP")} ·{" "}
            <a href={a.url} target="_blank" rel="noreferrer" className="text-blue-500 underline">
              元記事
            </a>
          </p>
          {a.description && <p className="text-sm text-slate-600">{a.description}</p>}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => openInReader(a)}
              className="rounded-xl border border-blue-600 py-2.5 text-sm font-semibold text-blue-600 active:bg-blue-50"
            >
              リーダーで読む
            </button>
            <button
              onClick={() => generateQuiz(a)}
              disabled={generating !== null}
              className="rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white active:bg-blue-700 disabled:opacity-40"
            >
              {generating === a.url ? "生成中..." : "問題を生成 →"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
