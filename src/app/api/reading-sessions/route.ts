// POST /api/reading-sessions — 記事リーダーでの閲覧セッションを記録
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const session = await prisma.readingSession.create({
    data: {
      articleTitle: body.articleTitle ? String(body.articleTitle) : null,
      articleUrl: body.articleUrl ? String(body.articleUrl) : null,
      sourceName: body.sourceName ? String(body.sourceName) : null,
      charCount: Number(body.charCount ?? 0),
      tappedWords: 0,
    },
  });
  return NextResponse.json(session, { status: 201 });
}
