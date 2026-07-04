// POST /api/quizzes — 記事本文から学習問題を生成して保存
// 1. ReadingSessionを作成(出典情報つき)
// 2. quizGen(AI経路 or 簡易ロジック経路)で読解クイズ+語彙を生成
// 3. クイズはQuizテーブルへ、語彙はWordテーブル(source: "reading")へ保存
//    → 語彙はフラッシュカードのSRSに自動的に合流する
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateFromArticle } from "@/lib/quizGen";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const title = String(body.title ?? "").trim();
  const text = String(body.text ?? "").trim();
  if (!text || text.length < 50) {
    return NextResponse.json(
      { error: "記事本文が短すぎます(50文字以上必要)" },
      { status: 400 }
    );
  }

  const generated = await generateFromArticle(title, text);

  const session = await prisma.readingSession.create({
    data: {
      articleTitle: title || null,
      articleUrl: body.url ? String(body.url) : null,
      sourceName: body.sourceName ? String(body.sourceName) : null,
      charCount: text.length,
      quizzes: {
        create: generated.quizzes.map((q) => ({
          question: q.question,
          choices: JSON.stringify(q.choices), // SQLiteに配列型がないためJSON文字列化
          answerIndex: q.answerIndex,
          explanation: q.explanation,
        })),
      },
    },
    include: { quizzes: true },
  });

  // 語彙をWordに保存(既存の同じ単語はスキップ)
  let savedVocab = 0;
  for (const v of generated.vocabulary) {
    const term = v.term.toLowerCase();
    const exists = await prisma.word.findFirst({ where: { term } });
    if (exists) continue;
    await prisma.word.create({
      data: {
        term,
        meaning: v.meaning,
        example: v.example ?? null,
        category: "reading",
        source: "reading",
      },
    });
    savedVocab++;
  }

  return NextResponse.json(
    {
      sessionId: session.id,
      quizCount: session.quizzes.length,
      vocabCount: savedVocab,
      generatedBy: generated.generatedBy,
    },
    { status: 201 }
  );
}
