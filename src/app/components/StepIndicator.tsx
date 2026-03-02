'use client';

const steps = [
  { label: '输入内容', icon: '📖' },
  { label: '分析提取', icon: '🔍' },
  { label: '提示词生成', icon: '✍️' },
  { label: '素材生成', icon: '🎨' },
  { label: '完成', icon: '✅' },
];

export default function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
              i < current
                ? 'bg-indigo-500/20 text-indigo-400'
                : i === current
                ? 'bg-indigo-500 text-white font-medium'
                : 'bg-[var(--card)] text-[var(--muted)]'
            }`}
          >
            <span>{s.icon}</span>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 mx-1 ${
                i < current ? 'bg-indigo-500/50' : 'bg-[var(--border)]'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
