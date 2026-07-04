// GET /api/flashcards — 復習期限が来ているカードを返す
// nextReviewAt <= 現在時刻 の単語を、期限が古い順に最大20枚
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GETで引数なしのroute はNext.jsが静的化(ビルド時に1回だけ実行)してしまうため、
// 毎回DBを読むよう動的実行を強制する
export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const due = await prisma.word.findMany({
    where: { nextReviewAt: { lte: now } },
    orderBy: { nextReviewAt: "asc" },
    take: 20,
  });
  const totalDue = await prisma.word.count({ where: { nextReviewAt: { lte: now } } });
  return NextResponse.json({ cards: due, totalDue });
}
