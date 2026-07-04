// PATCH /api/reading-sessions/[id] — タップした単語数を加算
// GET   /api/reading-sessions/[id] — セッションとクイズ一覧を取得(クイズ受験ページで使用)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const session = await prisma.readingSession.findUnique({
    where: { id },
    include: { quizzes: { orderBy: { id: "asc" } } },
  });
  if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(session);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await req.json().catch(() => ({}));
  const increment = Number(body.tappedWordsIncrement ?? 1);
  const session = await prisma.readingSession.update({
    where: { id },
    data: { tappedWords: { increment } },
  });
  return NextResponse.json(session);
}
