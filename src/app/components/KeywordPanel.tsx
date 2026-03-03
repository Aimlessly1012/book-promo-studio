'use client';

import { useStore } from '@/lib/store';

export default function KeywordPanel() {
  const { bookDNA, adMaterials } = useStore();
  if (!bookDNA) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">🔍 书籍 DNA 分析</h2>
        <p className="text-[var(--muted)] text-sm mt-1">Claude 从书籍中提取的核心信息</p>
      </div>

      {/* 核心标签 */}
      <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
        <h3 className="font-semibold mb-3">🏷️ 核心标签 / Tropes</h3>
        <div className="flex flex-wrap gap-2">
          {bookDNA.primary_tropes.map((trope, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-full text-sm border border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
            >
              {trope}
            </span>
          ))}
        </div>
      </div>

      {/* 视觉风格 & 情感钩子 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h3 className="font-semibold mb-3">🎨 视觉风格</h3>
          <p className="text-sm text-amber-300/80 italic">"{bookDNA.visual_aesthetic}"</p>
        </div>
        <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h3 className="font-semibold mb-3">❤️ 情感触发点</h3>
          <p className="text-sm text-rose-300/80 italic">"{bookDNA.emotional_trigger}"</p>
        </div>
      </div>

      {/* 广告角度预览 */}
      {adMaterials && (
        <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
          <h3 className="font-semibold mb-4">📐 生成的 {adMaterials.length} 个广告角度</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {adMaterials.map((mat, i) => (
              <div key={i} className="bg-black/30 rounded-lg p-4">
                <div className="text-xs text-indigo-400 font-medium mb-1">角度 {i + 1}</div>
                <div className="text-sm font-semibold mb-2">{mat.angle_name}</div>
                <p className="text-xs text-[var(--muted)] italic">"{mat.copywriting.hook}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
