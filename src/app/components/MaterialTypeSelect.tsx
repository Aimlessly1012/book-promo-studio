'use client';

import { useStore } from '@/lib/store';
import type { MaterialType } from '@/lib/claude';

const MATERIALS: {
  value: MaterialType;
  icon: string;
  label: string;
  desc: string;
  detail: string;
  color: string;
}[] = [
  {
    value: '轮播视频',
    icon: '🎠',
    label: '轮播视频',
    desc: '多段视频轮播',
    detail: '连续镜头 · 分段转场 · 15-30s 竖版',
    color: 'border-indigo-500 bg-indigo-500/10',
  },
  {
    value: '轮播图片',
    icon: '🖼️',
    label: '轮播图片',
    desc: '多图轮播',
    detail: '3-4 张静图 · 统一风格 · 每图独立叙事',
    color: 'border-sky-500 bg-sky-500/10',
  },
  {
    value: '解压',
    icon: '🧸',
    label: '解压',
    desc: 'ASMR 解压类',
    detail: '质感画面 · 慢动作 · 循环感 · 色彩饱满',
    color: 'border-amber-500 bg-amber-500/10',
  },
  {
    value: '滚屏漫画',
    icon: '📜',
    label: '滚屏漫画',
    desc: '竖版滚动漫画',
    detail: 'Webtoon 分格 · 逐格展示 · 9:16 竖版',
    color: 'border-rose-500 bg-rose-500/10',
  },
];

const ANGLE_OPTIONS = [1, 2, 3, 5, 8];

export default function MaterialTypeSelect({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { materialType, setMaterialType, angleCount, setAngleCount } = useStore();

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">🎨 选择素材类型</h2>
      <p className="text-[var(--muted)] mb-8">
        素材类型决定图片 Prompt、视频 Prompt 的生成格式，影响最终投放效果。
      </p>

      <div className="grid grid-cols-2 gap-4">
        {MATERIALS.map((mat) => (
          <button
            key={mat.value}
            onClick={() => setMaterialType(mat.value)}
            className={`relative p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${
              materialType === mat.value
                ? mat.color
                : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted)]'
            }`}
          >
            {materialType === mat.value && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                ✓
              </div>
            )}
            <div className="text-3xl mb-3">{mat.icon}</div>
            <div className="font-semibold text-base mb-0.5">{mat.label}</div>
            <div className="text-sm text-[var(--muted)] mb-2">{mat.desc}</div>
            <div className="text-xs opacity-60">{mat.detail}</div>
          </button>
        ))}
      </div>

      {/* 广告角度数量 */}
      <div className="mt-8 p-5 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-base">📐 广告角度数量</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">AI 将生成几个不同切入点的广告方案</p>
          </div>
          <span className="text-2xl font-bold text-indigo-400">{angleCount}</span>
        </div>
        <div className="flex items-center gap-2">
          {ANGLE_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setAngleCount(n)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                angleCount === n
                  ? 'bg-indigo-500 text-white'
                  : 'bg-[var(--border)] text-[var(--muted)] hover:text-white hover:bg-indigo-500/40'
              }`}
            >
              {n}
            </button>
          ))}
          {/* 自定义输入 */}
          <input
            type="number"
            min={1}
            max={20}
            value={angleCount}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 1 && v <= 20) setAngleCount(v);
            }}
            className="w-16 py-2 px-2 rounded-xl text-sm text-center bg-[var(--border)] focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
            title="自定义数量（1-20）"
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2.5 border border-[var(--border)] rounded-xl text-sm hover:bg-[var(--card)] transition-colors"
        >
          ← 上一步
        </button>
        <button
          onClick={onNext}
          className="px-8 py-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-medium transition-colors"
        >
          开始生成 →
        </button>
      </div>
    </div>
  );
}
