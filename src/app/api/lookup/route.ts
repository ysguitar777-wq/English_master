// GET /api/lookup?word=xxx — 単語の意味を返す(記事リーダーのタップ時に使用)
// 1. DBのWordテーブル(シード済みの単語・登録済み単語)を検索
// 2. 見つからなければ静的辞書(src/lib/dictionary.ts)を検索
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lookup } from "@/lib/dictionary";

export async function GET(req: NextRequest) {
  const word = req.nextUrl.searchParams.get("word")?.trim();
  if (!word) {
    return NextResponse.json({ error: "word parameter is required" }, { status: 400 });
  }

  const dbHit = await prisma.word.findFirst({
    where: { term: word.toLowerCase() },
  });
  if (dbHit) {
    return NextResponse.json({
      term: dbHit.term,
      meaning: dbHit.meaning,
      found: true,
      source: "db",
    });
  }

  const dictHit = lookup(word);
  if (dictHit) {
    return NextResponse.json({ ...dictHit, found: true, source: "dictionary" });
  }

  return NextResponse.json({ term: word.toLowerCase(), meaning: null, found: false });
}
