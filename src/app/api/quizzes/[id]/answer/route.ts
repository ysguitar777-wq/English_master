// POST /api/quizzes/[id]/answer — 読解クイズの回答を記録
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await req.json();
  const choiceIndex = Number(body.choiceIndex);

  const quiz = await prisma.quiz.findUnique({ where: { id } });
  if (!quiz) return NextResponse.json({ error: "not found" }, { status: 404 });

  const correct = choiceIndex === quiz.answerIndex;
  await prisma.quiz.update({
    where: { id },
    data: { answeredCorrect: correct },
  });

  return NextResponse.json({
    correct,
    answerIndex: quiz.answerIndex,
    explanation: quiz.explanation,
  });
}
