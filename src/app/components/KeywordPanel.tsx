'use client';

import { useStore } from '@/lib/store';

export default function KeywordPanel() {
  const { keywords } = useStore();
  if (!keywords) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">🔍 分析结果</h2>
        <p className="text-indigo-400 mt-1">{keywords.title}</p>
        <p className="text-[var(--muted)] text-sm mt-1">{keywords.coreTheme}</p>
      </div>

      {/* 关键词云 */}
      <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
        <h3 className="font-semibold mb-3">🏷️ 核心关键词</h3>
        <div className="flex flex-wrap gap-2">
          {keywords.keywords.map((kw, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-full text-sm border transition-colors hover:bg-indigo-500/20"
              style={{
                borderColor: `hsl(${240 + i * 8}, 60%, ${50 + kw.weight * 3}%)`,
                fontSize: `${0.75 + kw.weight * 0.04}rem`,
              }}
            >
              {kw.word}
              <span className="text-xs text-[var(--muted)] ml-1">{kw.emotion}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 卖点 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h3 className="font-semibold mb-3">💎 核心卖点</h3>
          <ul className="space-y-2">
            {keywords.sellingPoints.map((sp, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-indigo-400 mt-0.5">•</span>
                <span>{sp}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h3 className="font-semibold mb-3">🎯 目标人群</h3>
          <div className="flex flex-wrap gap-2">
            {keywords.targetAudience.map((ta, i) => (
              <span key={i} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm">
                {ta}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 情感钩子 & 金句 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h3 className="font-semibold mb-3">❤️ 情感钩子</h3>
          <ul className="space-y-2">
            {keywords.emotionalHooks.map((eh, i) => (
              <li key={i} className="text-sm text-amber-300/80 italic">&ldquo;{eh}&rdquo;</li>
            ))}
          </ul>
        </div>

        <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h3 className="font-semibold mb-3">✨ 金句摘录</h3>
          <ul className="space-y-2">
            {keywords.goldenQuotes.map((gq, i) => (
              <li key={i} className="text-sm text-indigo-300/80 italic">&ldquo;{gq}&rdquo;</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
