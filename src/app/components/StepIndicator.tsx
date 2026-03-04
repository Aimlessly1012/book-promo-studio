'use client';

const steps = [
  { label: '渠道', icon: '📡' },
  { label: '书籍', icon: '📖' },
  { label: '文案类型', icon: '✍️' },
  { label: '素材类型', icon: '🎨' },
  { label: '生成结果', icon: '🚀' },
];

export default function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-8 flex-wrap">
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
              className={`w-6 h-0.5 mx-0.5 ${
                i < current ? 'bg-indigo-500/50' : 'bg-[var(--border)]'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
