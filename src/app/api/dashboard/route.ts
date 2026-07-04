// GET /api/dashboard — ダッシュボード用の集計データ
// 直近14日の日別復習数・正答率、わからなかった単語一覧、累計値を返す
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GETで引数なしのroute はNext.jsが静的化(ビルド時に1回だけ実行)してしまうため、
// 毎回DBを読むよう動的実行を強制する
export const dynamic = "force-dynamic";

export async function GET() {
  const days = 14;
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (days - 1));

  const [logs, readingWords, totalWords, totalReviews, dueCount, sessions] =
    await Promise.all([
      prisma.reviewLog.findMany({
        where: { reviewedAt: { gte: from } },
        select: { correct: true, reviewedAt: true },
      }),
      prisma.word.findMany({
        where: { source: "reading" },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.word.count(),
      prisma.reviewLog.count(),
      prisma.word.count({ where: { nextReviewAt: { lte: new Date() } } }),
      prisma.readingSession.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { quizzes: { select: { answeredCorrect: true } } },
      }),
    ]);

  // 日別に集計(JS側で行う。SQLiteのdate関数に依存しないためポータブル)
  const daily: { date: string; reviews: number; correct: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    daily.push({ date: d.toISOString().slice(0, 10), reviews: 0, correct: 0 });
  }
  const dailyMap = new Map(daily.map((d) => [d.date, d]));
  for (const log of logs) {
    // ローカル日付キーに変換して集計
    const local = new Date(log.reviewedAt);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    const key = local.toISOString().slice(0, 10);
    const bucket = dailyMap.get(key);
    if (bucket) {
      bucket.reviews++;
      if (log.correct) bucket.correct++;
    }
  }

  return NextResponse.json({
    daily,
    readingWords,
    totals: { words: totalWords, reviews: totalReviews, due: dueCount },
    recentSessions: sessions.map((s) => ({
      id: s.id,
      articleTitle: s.articleTitle,
      sourceName: s.sourceName,
      charCount: s.charCount,
      tappedWords: s.tappedWords,
      createdAt: s.createdAt,
      quizTotal: s.quizzes.length,
      quizCorrect: s.quizzes.filter((q) => q.answeredCorrect === true).length,
      quizAnswered: s.quizzes.filter((q) => q.answeredCorrect !== null).length,
    })),
  });
}
