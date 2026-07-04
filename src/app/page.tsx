"use client";
// トップページ: 学習履歴ダッシュボード
import { useEffect, useState } from "react";
import Link from "next/link";
import { AccuracyLineChart, DailyBarChart, DailyPoint } from "@/components/charts";

type Dashboard = {
  daily: DailyPoint[];
  readingWords: { id: number; term: string; meaning: string; createdAt: string }[];
  totals: { words: number; reviews: number; due: number };
  recentSessions: {
    id: number;
    articleTitle: string | null;
    sourceName: string | null;
    charCount: number;
    tappedWords: number;
    quizTotal: number;
    quizCorrect: number;
    quizAnswered: number;
    createdAt: string;
  }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("データの取得に失敗しました"));
  }, []);

  if (error) return <p className="py-8 text-center text-red-600">{error}</p>;
  if (!data) return <p className="py-8 text-center text-slate-400">読み込み中...</p>;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">📊 学習ダッシュボード</h1>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-2">
        <StatTile label="登録単語" value={data.totals.words} />
        <StatTile label="累計復習" value={data.totals.reviews} />
        <StatTile label="復習待ち" value={data.totals.due} highlight={data.totals.due > 0} />
      </div>

      {data.totals.due > 0 && (
        <Link
          href="/flashcards"
          className="block rounded-xl bg-blue-600 py-3 text-center font-semibold text-white active:bg-blue-700"
        >
          {data.totals.due}枚のカードを復習する →
        </Link>
      )}

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">日別の復習数(直近14日)</h2>
        <DailyBarChart data={data.daily} />
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">正答率の推移(%)</h2>
        <AccuracyLineChart data={data.daily} />
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">
          わからなかった単語({data.readingWords.length})
        </h2>
        {data.readingWords.length === 0 ? (
          <p className="text-sm text-slate-400">
            記事リーダーで単語をタップして登録すると、ここに表示されフラッシュカードにも出題されます。
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.readingWords.map((w) => (
              <li key={w.id} className="flex items-baseline justify-between gap-3 py-2">
                <span className="font-medium">{w.term}</span>
                <span className="text-right text-sm text-slate-500">{w.meaning}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">最近の読書セッション</h2>
        {data.recentSessions.length === 0 ? (
          <p className="text-sm text-slate-400">まだ記録がありません。</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {data.recentSessions.map((s) => (
              <li key={s.id} className="py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">
                    {s.articleTitle ?? "(貼り付けテキスト)"}
                  </span>
                  {s.quizTotal > 0 && (
                    <Link href={`/quiz/${s.id}`} className="shrink-0 text-blue-600">
                      クイズ {s.quizCorrect}/{s.quizTotal} →
                    </Link>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  {s.sourceName && <span>{s.sourceName} · </span>}
                  {s.charCount}文字 · タップ{s.tappedWords}語 ·{" "}
                  {new Date(s.createdAt).toLocaleDateString("ja-JP")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatTile({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-xl bg-white p-3 text-center shadow-sm">
      <div className={`text-2xl font-bold ${highlight ? "text-blue-600" : ""}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
