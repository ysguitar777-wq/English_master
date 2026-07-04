"use client";
// 軽量なSVGチャート(外部チャートライブラリ不使用)
// 色はCVD(色覚多様性)検証済みのパレットから使用: blue #2a78d6 / aqua #1baf7a

import { useState } from "react";

export type DailyPoint = { date: string; reviews: number; correct: number };

// 日別復習数の棒グラフ
export function DailyBarChart({ data }: { data: DailyPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const W = 560;
  const H = 160;
  const pad = { top: 24, bottom: 22, left: 8, right: 8 };
  const max = Math.max(1, ...data.map((d) => d.reviews));
  const bw = (W - pad.left - pad.right) / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="日別の復習数">
      {data.map((d, i) => {
        const h = ((H - pad.top - pad.bottom) * d.reviews) / max;
        const x = pad.left + i * bw;
        const y = H - pad.bottom - h;
        const isActive = active === i;
        const showLabel = isActive || (d.reviews === max && d.reviews > 0);
        return (
          <g key={d.date} onClick={() => setActive(isActive ? null : i)}>
            {/* タップ領域はバーより広く取る */}
            <rect x={x} y={pad.top} width={bw} height={H - pad.top - pad.bottom} fill="transparent" />
            {d.reviews > 0 && (
              <rect
                x={x + bw * 0.18}
                y={y}
                width={bw * 0.64}
                height={h}
                rx={3}
                fill="#2a78d6"
                opacity={active === null || isActive ? 1 : 0.45}
              />
            )}
            {showLabel && (
              <text x={x + bw / 2} y={y - 6} textAnchor="middle" fontSize={12} fill="#334155">
                {d.reviews}
              </text>
            )}
            {i % 2 === 0 && (
              <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize={9.5} fill="#64748b">
                {d.date.slice(5).replace("-", "/")}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// 正答率の推移(折れ線)。復習が0件の日は線を繋がず点を打たない
export function AccuracyLineChart({ data }: { data: DailyPoint[] }) {
  const W = 560;
  const H = 150;
  const pad = { top: 20, bottom: 22, left: 30, right: 12 };
  const bw = (W - pad.left - pad.right) / data.length;
  const yFor = (rate: number) => pad.top + (H - pad.top - pad.bottom) * (1 - rate);

  const points = data
    .map((d, i) =>
      d.reviews > 0
        ? { i, x: pad.left + i * bw + bw / 2, y: yFor(d.correct / d.reviews), rate: d.correct / d.reviews }
        : null
    )
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // データのある日だけを線で結ぶ
  const path = points.map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="正答率の推移">
      {[0, 0.5, 1].map((r) => (
        <g key={r}>
          <line x1={pad.left} x2={W - pad.right} y1={yFor(r)} y2={yFor(r)} stroke="#e2e8f0" strokeWidth={1} />
          <text x={pad.left - 4} y={yFor(r) + 3.5} textAnchor="end" fontSize={9.5} fill="#64748b">
            {Math.round(r * 100)}%
          </text>
        </g>
      ))}
      {points.length > 1 && <path d={path} fill="none" stroke="#1baf7a" strokeWidth={2} />}
      {points.map((p) => (
        <g key={p.i}>
          <circle cx={p.x} cy={p.y} r={4} fill="#1baf7a" stroke="#ffffff" strokeWidth={2} />
          {/* コントラスト補助: 値を常に文字で表示 */}
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={10.5} fill="#334155">
            {Math.round(p.rate * 100)}
          </text>
        </g>
      ))}
      {points.length === 0 && (
        <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={12} fill="#94a3b8">
          まだ復習データがありません
        </text>
      )}
    </svg>
  );
}
