"use client";
// 読解クイズ受験ページ: 記事から生成された4択問題に回答する
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Quiz = {
  id: number;
  question: string;
  choices: string; // JSON文字列
  answerIndex: number;
  explanation: string | null;
  answeredCorrect: boolean | null;
};

type Session = {
  id: number;
  articleTitle: string | null;
  articleUrl: string | null;
  sourceName: string | null;
  quizzes: Quiz[];
};

export default function QuizPage() {
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{
    correct: boolean;
    answerIndex: number;
    explanation: string | null;
  } | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetch(`/api/reading-sessions/${params.id}`)
      .then((r) => r.json())
      .then(setSession);
  }, [params.id]);

  if (!session) return <p className="py-8 text-center text-slate-400">読み込み中...</p>;

  const quiz = session.quizzes[index];
  const finished = index >= session.quizzes.length;

  async function answer(choiceIndex: number) {
    if (!quiz || result) return;
    setSelected(choiceIndex);
    const res = await fetch(`/api/quizzes/${quiz.id}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choiceIndex }),
    });
    const data = await res.json();
    setResult(data);
    if (data.correct) setScore((s) => s + 1);
  }

  function next() {
    setSelected(null);
    setResult(null);
    setIndex((i) => i + 1);
  }

  if (finished || session.quizzes.length === 0) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-4xl">🏆</p>
        <h1 className="text-lg font-bold">クイズ終了!</h1>
        {session.quizzes.length > 0 && (
          <p className="text-2xl font-bold">
            {score} / {session.quizzes.length} 正解
          </p>
        )}
        <p className="text-sm text-slate-500">
          記事から抽出した語彙はフラッシュカードに追加されています。
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/flashcards" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
            カードを復習する
          </Link>
          <Link href="/" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600">
            ダッシュボードへ
          </Link>
        </div>
      </div>
    );
  }

  const choices: string[] = JSON.parse(quiz.choices);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="truncate text-lg font-bold">{session.articleTitle ?? "読解クイズ"}</h1>
        {session.sourceName && (
          <p className="text-xs text-slate-400">
            出典: {session.sourceName}
            {session.articleUrl && (
              <>
                {" · "}
                <a href={session.articleUrl} target="_blank" rel="noreferrer" className="underline">
                  元記事
                </a>
              </>
            )}
          </p>
        )}
      </div>

      <p className="text-sm text-slate-500">
        問題 {index + 1} / {session.quizzes.length}
      </p>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="font-medium leading-relaxed">{quiz.question}</p>
      </div>

      <div className="space-y-2">
        {choices.map((choice, i) => {
          let style = "border-slate-200 bg-white active:bg-slate-50";
          if (result) {
            if (i === result.answerIndex) style = "border-green-500 bg-green-50";
            else if (i === selected) style = "border-red-400 bg-red-50";
            else style = "border-slate-200 bg-white opacity-60";
          }
          return (
            <button
              key={i}
              onClick={() => answer(i)}
              disabled={result !== null}
              className={`w-full rounded-xl border p-3 text-left text-sm leading-relaxed ${style}`}
            >
              <span className="mr-2 font-bold text-slate-400">{"ABCD"[i]}</span>
              {choice}
            </button>
          );
        })}
      </div>

      {result && (
        <div className="space-y-3">
          <div
            className={`rounded-xl p-3 text-sm ${
              result.correct ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}
          >
            <p className="font-bold">{result.correct ? "○ 正解!" : "✗ 不正解"}</p>
            {result.explanation && <p className="mt-1">{result.explanation}</p>}
          </div>
          <button
            onClick={next}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white active:bg-blue-700"
          >
            {index + 1 < session.quizzes.length ? "次の問題 →" : "結果を見る"}
          </button>
        </div>
      )}
    </div>
  );
}
