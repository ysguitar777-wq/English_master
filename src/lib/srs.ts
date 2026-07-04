// 間隔反復(Spaced Repetition)— 簡易SM-2アルゴリズム
//
// SM-2の考え方:
//   - 正解するたびに復習間隔(interval)を伸ばす: 1日 → 6日 → 前回×easeFactor
//   - easeFactor(記憶しやすさ係数)は回答品質に応じて微調整される
//   - 不正解なら間隔をリセットして翌日再出題
//
// 本来のSM-2は回答品質を0〜5の6段階で受け取るが、
// このアプリはボタン2つ(わかった/わからなかった)なので
// 正解=品質4、不正解=品質2 として扱う簡易版。

export type SrsState = {
  easeFactor: number; // 2.5が初期値。1.3未満にはしない
  interval: number; // 次回までの日数
  repetition: number; // 連続正解回数
};

export function review(state: SrsState, correct: boolean): SrsState & { nextReviewAt: Date } {
  let { easeFactor, interval, repetition } = state;

  if (correct) {
    repetition += 1;
    if (repetition === 1) interval = 1;
    else if (repetition === 2) interval = 6;
    else interval = Math.round(interval * easeFactor);
    // 品質4相当のEF更新: EF' = EF + (0.1 - (5-q)*(0.08+(5-q)*0.02)) で q=4 → +0
    // 簡易版では正解時は維持とする
  } else {
    // 不正解: 連続正解をリセットし、翌日もう一度出題。EFを下げる(q=2相当で -0.32)
    repetition = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.32);
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);
  return { easeFactor, interval, repetition, nextReviewAt };
}
