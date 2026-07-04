// POST /api/reviews — フラッシュカードの回答を記録
// SM-2アルゴリズムで単語のSRS状態(interval, easeFactor等)を更新し、ReviewLogに1行追加する
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { review } from "@/lib/srs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const wordId = Number(body.wordId);
  const correct = Boolean(body.correct);
  if (!Number.isInteger(wordId)) {
    return NextResponse.json({ error: "wordId is required" }, { status: 400 });
  }

  const word = await prisma.word.findUnique({ where: { id: wordId } });
  if (!word) {
    return NextResponse.json({ error: "word not found" }, { status: 404 });
  }

  const next = review(
    { easeFactor: word.easeFactor, interval: word.interval, repetition: word.repetition },
    correct
  );

  // $transaction: 2つの書き込みを両方成功 or 両方失敗にする(片方だけ記録される事故を防ぐ)
  const [updated] = await prisma.$transaction([
    prisma.word.update({
      where: { id: wordId },
      data: {
        easeFactor: next.easeFactor,
        interval: next.interval,
        repetition: next.repetition,
        nextReviewAt: next.nextReviewAt,
      },
    }),
    prisma.reviewLog.create({
      data: { wordId, correct, nextReviewAt: next.nextReviewAt },
    }),
  ]);

  return NextResponse.json({ word: updated, nextReviewAt: next.nextReviewAt });
}
