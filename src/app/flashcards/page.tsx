"use client";
// フラッシュカード: SRS(間隔反復)で復習期限が来た単語を出題する
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Card = {
  id: number;
  term: string;
  meaning: string;
  example: string | null;
  category: string;
  source: string;
};

const categoryLabels: Record<string, string> = {
  general: "一般IT",
  programming: "プログラミング",
  git: "Git/GitHub",
  error: "エラー表現",
  comment: "コメント表現",
  reading: "記事から登録",
};

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/flashcards");
    const data = await res.json();
    setCards(data.cards);
    setTotalDue(data.totalDue);
    setIndex(0);
    setFlipped(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const card = cards[index];

  async function answer(correct: boolean) {
    if (!card || submitting) return;
    setSubmitting(true);
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: card.id, correct }),
    });
    setDoneCount((c) => c + 1);
    setSubmitting(false);
    setFlipped(false);
    if (index + 1 < cards.length) {
      setIndex(index + 1);
    } else {
      await load(); // 1バッチ(最大20枚)終了 → 残りの期限到来カードを再取得
    }
  }

  if (loading) return <p className="py-8 text-center text-slate-400">読み込み中...</p>;

  if (!card) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-4xl">🎉</p>
        <h1 className="text-lg font-bold">復習完了!</h1>
        <p className="text-sm text-slate-500">
          {doneCount > 0
            ? `今回は${doneCount}枚のカードを復習しました。`
            : "いま復習期限のカードはありません。"}
        </p>
        <p className="text-sm text-slate-500">
          <Link href="/reader" className="text-blue-600 underline">
            記事リーダー
          </Link>
          で新しい単語を登録するか、
          <Link href="/news" className="text-blue-600 underline">
            記事取得
          </Link>
          で語彙を増やせます。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">🃏 フラッシュカード</h1>
        <span className="text-sm text-slate-500">残り {totalDue - doneCount} 枚</span>
      </div>

      {/* カード本体: タップで裏返す */}
      <button
        onClick={() => setFlipped(!flipped)}
        className="flex min-h-64 w-full flex-col items-center justify-center gap-3 rounded-2xl bg-white p-6 shadow active:bg-slate-50"
      >
        <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs text-slate-500">
          {categoryLabels[card.category] ?? card.category}
        </span>
        {!flipped ? (
          <>
            <span className="text-center text-3xl font-bold">{card.term}</span>
            <span className="text-xs text-slate-400">タップして意味を表示</span>
          </>
        ) : (
          <>
            <span className="text-center text-lg text-slate-500">{card.term}</span>
            <span className="text-center text-2xl font-bold">{card.meaning}</span>
            {card.example && (
              <p className="text-center text-sm italic text-slate-500">“{card.example}”</p>
            )}
          </>
        )}
      </button>

      {/* 回答ボタン: 裏面表示後に有効化 */}
      {flipped ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => answer(false)}
            disabled={submitting}
            className="rounded-xl bg-red-100 py-4 font-semibold text-red-700 active:bg-red-200 disabled:opacity-50"
          >
            ✗ わからなかった
          </button>
          <button
            onClick={() => answer(true)}
            disabled={submitting}
            className="rounded-xl bg-green-100 py-4 font-semibold text-green-700 active:bg-green-200 disabled:opacity-50"
          >
            ○ わかった
          </button>
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-slate-400">
          カードをタップして意味を確認してから回答してください
        </p>
      )}
    </div>
  );
}
