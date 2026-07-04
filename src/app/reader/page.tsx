"use client";
// 記事リーダー: 英文を貼り付けて表示し、単語タップで意味を確認・登録できる
import { useEffect, useState } from "react";

type Popup = {
  word: string; // タップされた元の単語(表示用)
  term: string; // 辞書で見つかった基本形
  meaning: string | null;
  registered: boolean;
};

export default function ReaderPage() {
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [reading, setReading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [popup, setPopup] = useState<Popup | null>(null);
  const [tapped, setTapped] = useState(0);
  const [meta, setMeta] = useState<{ url?: string; sourceName?: string }>({});

  // 記事取得ページから「リーダーで読む」で遷移した場合、sessionStorage経由で本文を受け取る
  useEffect(() => {
    const stored = sessionStorage.getItem("reader-article");
    if (stored) {
      sessionStorage.removeItem("reader-article");
      try {
        const a = JSON.parse(stored);
        setTitle(a.title ?? "");
        setInput(a.text ?? "");
        setMeta({ url: a.url, sourceName: a.sourceName });
      } catch {}
    }
  }, []);

  async function startReading() {
    if (!input.trim()) return;
    // 閲覧ログ(文字数)を保存してセッション開始
    const res = await fetch("/api/reading-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articleTitle: title || null,
        articleUrl: meta.url ?? null,
        sourceName: meta.sourceName ?? null,
        charCount: input.length,
      }),
    });
    const session = await res.json();
    setSessionId(session.id);
    setReading(true);
    setTapped(0);
  }

  async function tapWord(word: string) {
    const clean = word.replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, "");
    if (!clean) return;
    setPopup({ word: clean, term: clean, meaning: null, registered: false });

    // 意味を取得(DB → 静的辞書の順に検索)
    const res = await fetch(`/api/lookup?word=${encodeURIComponent(clean)}`);
    const data = await res.json();
    setPopup({
      word: clean,
      term: data.term ?? clean,
      meaning: data.found ? data.meaning : null,
      registered: false,
    });

    // タップ数のログを加算
    setTapped((t) => t + 1);
    if (sessionId) {
      fetch(`/api/reading-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tappedWordsIncrement: 1 }),
      });
    }
  }

  async function registerWord() {
    if (!popup) return;
    await fetch("/api/words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        term: popup.term,
        meaning: popup.meaning ?? "",
      }),
    });
    setPopup({ ...popup, registered: true });
  }

  if (!reading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">📖 記事リーダー</h1>
        <p className="text-sm text-slate-500">
          英語の記事を貼り付けて「読む」を押すと、単語をタップして意味を確認できます。
        </p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトル(任意)"
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
        />
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ここに英語の文章を貼り付け..."
          rows={12}
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
        />
        <button
          onClick={startReading}
          disabled={!input.trim()}
          className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white active:bg-blue-700 disabled:opacity-40"
        >
          読む({input.length}文字)
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="truncate text-lg font-bold">{title || "📖 リーディング"}</h1>
        <button
          onClick={() => {
            setReading(false);
            setPopup(null);
          }}
          className="shrink-0 text-sm text-blue-600"
        >
          ← 戻る
        </button>
      </div>
      {meta.sourceName && (
        <p className="text-xs text-slate-400">
          出典: {meta.sourceName}
          {meta.url && (
            <>
              {" · "}
              <a href={meta.url} target="_blank" rel="noreferrer" className="underline">
                元記事を開く
              </a>
            </>
          )}
        </p>
      )}
      <p className="text-xs text-slate-400">単語をタップすると意味が表示されます(タップ済み: {tapped}語)</p>

      {/* 本文: 単語ごとにタップ可能なspanに分割 */}
      <div className="rounded-xl bg-white p-4 text-[17px] leading-8 shadow-sm">
        {input.split(/(\s+)/).map((token, i) =>
          /\s/.test(token) || !/[a-zA-Z]/.test(token) ? (
            <span key={i}>{token}</span>
          ) : (
            <span
              key={i}
              onClick={() => tapWord(token)}
              className="cursor-pointer rounded active:bg-yellow-200"
            >
              {token}
            </span>
          )
        )}
      </div>

      {/* 単語ポップアップ(下部固定シート) */}
      {popup && (
        <div className="fixed bottom-16 left-0 right-0 z-10 mx-auto max-w-2xl px-4 pb-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-lg font-bold">{popup.word}</div>
                <div className="text-sm text-slate-600">
                  {popup.meaning === null && popup.term === popup.word && !popup.registered
                    ? "辞書に意味が見つかりませんでした(登録して後で意味を追記できます)"
                    : popup.meaning ?? "検索中..."}
                </div>
              </div>
              <button onClick={() => setPopup(null)} className="p-1 text-slate-400">
                ✕
              </button>
            </div>
            <button
              onClick={registerWord}
              disabled={popup.registered}
              className="mt-3 w-full rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white active:bg-orange-600 disabled:bg-green-500"
            >
              {popup.registered ? "✓ 登録しました(フラッシュカードに追加)" : "わからなかった単語として登録"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
