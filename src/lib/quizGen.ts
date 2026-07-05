// 記事からの問題生成(ハイブリッド構成)
// - ANTHROPIC_API_KEY があれば: Anthropic API(軽量モデル)で読解クイズ+語彙抽出
// - なければ: 無料の簡易ロジック(頻度ベースの語彙抽出+キーワード穴埋め問題)
// どちらの経路も同じ GeneratedContent 型を返すので、呼び出し側は経路を意識しなくてよい。

import { isStopWord, lookup } from "./dictionary";

export type GeneratedQuiz = {
  question: string;
  choices: string[]; // 4択
  answerIndex: number;
  explanation: string;
};

export type GeneratedVocab = {
  term: string;
  meaning: string;
  example?: string;
};

export type GeneratedContent = {
  quizzes: GeneratedQuiz[];
  vocabulary: GeneratedVocab[];
  generatedBy: "ai" | "simple";
};

export async function generateFromArticle(
  title: string,
  text: string
): Promise<GeneratedContent> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await generateWithAI(title, text);
    } catch (e) {
      console.error("AI generation failed, falling back to simple logic:", e);
      // AI経路が失敗しても学習を止めない: 簡易ロジックにフォールバック
    }
  }
  return generateSimple(title, text);
}

// ===== AI経路 =====
// SDKを追加せず標準fetchでAnthropic Messages APIを直接呼ぶ(依存を最小にするため)

// モデルと思考の深さ(effort)は環境変数で差し替え可能。
// デフォルトは Sonnet 5 + xhigh: アダプティブ思考と組み合わせることで
// Sonnet 5 から最大限の品質(上位モデルに迫る出力)を引き出す構成。
// 注意: effort / adaptive thinking は Sonnet 5 / Opus 4.6+ / Fable 5 系で有効。
//       Haiku 4.5 など旧方式のモデルを CLAUDE_MODEL に指定するとAPIエラーになる
//       (その場合も簡易ロジックへフォールバックするため学習は止まらない)。
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5";
const CLAUDE_EFFORT = process.env.CLAUDE_EFFORT || "xhigh"; // low | medium | high | xhigh | max

// 構造化出力(json_schema)でレスポンス形式をAPIレベルで強制する。
// プロンプト指示だけに頼るより堅牢で、コードフェンス混入やJSON崩れが起きない。
const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    quizzes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          choices: { type: "array", items: { type: "string" } },
          answerIndex: { type: "integer", enum: [0, 1, 2, 3] },
          explanation: { type: "string" },
        },
        required: ["question", "choices", "answerIndex", "explanation"],
        additionalProperties: false,
      },
    },
    vocabulary: {
      type: "array",
      items: {
        type: "object",
        properties: {
          term: { type: "string" },
          meaning: { type: "string" },
          example: { type: "string" },
        },
        required: ["term", "meaning"],
        additionalProperties: false,
      },
    },
  },
  required: ["quizzes", "vocabulary"],
  additionalProperties: false,
} as const;

async function generateWithAI(title: string, text: string): Promise<GeneratedContent> {
  const prompt = `You are an expert English learning material designer for a Japanese programmer.
Read the following English article and produce high-quality learning material.

Article title: ${title}
Article text:
"""
${text.slice(0, 6000)}
"""

Produce:
1. "quizzes": 3-5 multiple-choice reading comprehension questions about the article. Each has "question" (English), "choices" (array of exactly 4 English strings), "answerIndex" (0-3), "explanation" (explanation in Japanese that teaches why the answer is correct and where in the article it is supported).
   - Make distractors plausible: they should be wrong for a specific reason (e.g. contradicted by the article, or true but not what the question asks), not obviously absurd.
   - Cover different parts and aspects of the article rather than asking about the same paragraph repeatedly.
2. "vocabulary": about 10 important English words or expressions from the article that are genuinely useful for a Japanese engineer. Each has "term", "meaning" (natural Japanese), "example" (a short English example sentence, ideally quoted from the article).
   - Prefer words/expressions the reader is likely to encounter again in technical or business English; skip trivial words.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      // 思考(thinking)トークンも max_tokens に含まれるため、xhigh でも
      // 途中で切れないよう余裕を持たせる
      max_tokens: 16000,
      thinking: { type: "adaptive" }, // モデルが必要に応じて深く考える
      output_config: {
        effort: CLAUDE_EFFORT,
        format: { type: "json_schema", schema: OUTPUT_SCHEMA },
      },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error (HTTP ${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  // セーフティ分類器による拒否(refusal)はHTTP 200で返るため明示的に検出する
  if (data.stop_reason === "refusal") {
    throw new Error("Anthropic API refused the request");
  }
  // アダプティブ思考有効時は thinking ブロックが先頭に来るため、text ブロックを探す
  const raw: string =
    (data.content as { type: string; text?: string }[] | undefined)?.find(
      (b) => b.type === "text"
    )?.text ?? "";
  // AIの出力はスキーマ通りとは限らないため、unknownとして受けて検証しながら取り込む
  type RawQuiz = { question?: unknown; choices?: unknown; answerIndex?: unknown; explanation?: unknown };
  type RawVocab = { term?: unknown; meaning?: unknown; example?: unknown };
  const parsed: { quizzes?: RawQuiz[]; vocabulary?: RawVocab[] } = JSON.parse(raw);

  const quizzes: GeneratedQuiz[] = (parsed.quizzes ?? [])
    .filter(
      (q) =>
        typeof q.question === "string" &&
        Array.isArray(q.choices) &&
        q.choices.length === 4 &&
        Number.isInteger(q.answerIndex) &&
        (q.answerIndex as number) >= 0 &&
        (q.answerIndex as number) < 4
    )
    .map((q) => ({
      question: String(q.question),
      choices: (q.choices as unknown[]).map(String),
      answerIndex: q.answerIndex as number,
      explanation: String(q.explanation ?? ""),
    }));

  const vocabulary: GeneratedVocab[] = (parsed.vocabulary ?? [])
    .filter((v) => typeof v.term === "string" && typeof v.meaning === "string")
    .map((v) => ({
      term: String(v.term),
      meaning: String(v.meaning),
      example: v.example ? String(v.example) : undefined,
    }));

  if (quizzes.length === 0 && vocabulary.length === 0) {
    throw new Error("AI returned no usable content");
  }
  return { quizzes, vocabulary, generatedBy: "ai" };
}

// ===== 簡易ロジック経路(無料・APIキー不要) =====
function generateSimple(title: string, text: string): GeneratedContent {
  const sentences = splitSentences(text);
  const freq = wordFrequency(text);

  // 語彙抽出: 機能語でない・6文字以上の単語を出現頻度順に最大10語
  const keywords = [...freq.entries()]
    .filter(([w]) => w.length >= 6 && !isStopWord(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w]) => w);

  const vocabulary: GeneratedVocab[] = keywords.map((term) => {
    const hit = lookup(term);
    const example = sentences.find((s) => s.toLowerCase().includes(term));
    return {
      term,
      // 辞書にない単語は後で意味を補完できるようプレースホルダを入れて保存する
      meaning: hit?.meaning ?? "(意味を調べて追記してください)",
      example: example?.slice(0, 200),
    };
  });

  // 穴埋めクイズ: キーワードを含む文からその単語を空欄にし、他のキーワードを誤答候補にする
  const quizzes: GeneratedQuiz[] = [];
  const usedSentences = new Set<string>();
  for (const term of keywords) {
    if (quizzes.length >= 5) break;
    const sentence = sentences.find(
      (s) =>
        s.toLowerCase().includes(term) &&
        !usedSentences.has(s) &&
        s.length >= 40 &&
        s.length <= 300
    );
    if (!sentence) continue;
    usedSentences.add(sentence);

    const blanked = sentence.replace(new RegExp(`\\b${escapeRegExp(term)}\\b`, "i"), "_____");
    if (blanked === sentence) continue;

    // 誤答: 正解以外のキーワードから3つ
    const distractors = keywords.filter((k) => k !== term).slice(0, 3);
    if (distractors.length < 3) continue;

    const choices = shuffle([term, ...distractors]);
    quizzes.push({
      question: `Fill in the blank: "${blanked}"`,
      choices,
      answerIndex: choices.indexOf(term),
      explanation: `正解は "${term}"。元の文: ${sentence.slice(0, 200)}`,
    });
  }

  return { quizzes, vocabulary, generatedBy: "simple" };
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z"“])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function wordFrequency(text: string): Map<string, number> {
  const freq = new Map<string, number>();
  for (const match of text.toLowerCase().matchAll(/[a-z][a-z'-]*/g)) {
    const w = match[0];
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return freq;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
