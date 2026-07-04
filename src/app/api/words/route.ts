// /api/words
// GET  — 単語一覧(?source=reading で「わからなかった単語」のみ)
// POST — 単語を登録(記事リーダーの「わからなかった単語」ボタンから)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lookup } from "@/lib/dictionary";

export async function GET(req: NextRequest) {
  const source = req.nextUrl.searchParams.get("source") ?? undefined;
  const words = await prisma.word.findMany({
    where: source ? { source } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(words);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const term = String(body.term ?? "").trim().toLowerCase();
  if (!term) {
    return NextResponse.json({ error: "term is required" }, { status: 400 });
  }

  // 同じ単語の二重登録を防ぐ
  const existing = await prisma.word.findFirst({ where: { term } });
  if (existing) {
    return NextResponse.json({ word: existing, created: false });
  }

  const meaning =
    String(body.meaning ?? "").trim() ||
    lookup(term)?.meaning ||
    "(意味を調べて追記してください)";

  const word = await prisma.word.create({
    data: {
      term,
      meaning,
      example: body.example ? String(body.example) : null,
      category: String(body.category ?? "reading"),
      source: "reading", // 記事リーダー経由の登録。SRSに合流してフラッシュカードに出題される
    },
  });
  return NextResponse.json({ word, created: true }, { status: 201 });
}
