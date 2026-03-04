'use client';

import { useStore } from '@/lib/store';
import type { Platform } from '@/lib/claude';

const CHANNELS: {
  value: Platform;
  label: string;
  icon: string;
  desc: string;
  color: string;
  accentColor: string;
}[] = [
  {
    value: 'facebook',
    label: 'Facebook',
    icon: '📘',
    desc: '社交信息流 · 情感驱动 · 宽年龄段受众',
    color: 'border-blue-500 bg-blue-500/10',
    accentColor: 'text-blue-400',
  },
  {
    value: 'google',
    label: 'Google',
    icon: '🔍',
    desc: '搜索意图明确 · 利益清晰 · 主动阅读用户',
    color: 'border-emerald-500 bg-emerald-500/10',
    accentColor: 'text-emerald-400',
  },
  {
    value: 'tiktok',
    label: 'TikTok',
    icon: '🎵',
    desc: '娱乐优先 · 短平快 · Z世代爆款',
    color: 'border-pink-500 bg-pink-500/10',
    accentColor: 'text-pink-400',
  },
];

export default function ChannelSelect({ onNext }: { onNext: () => void }) {
  const { platform, setPlatform } = useStore();

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">📡 选择投放渠道</h2>
      <p className="text-[var(--muted)] mb-8">
        不同渠道的受众心态、文案风格、素材尺寸截然不同，选择正确渠道让 AI 生成更精准的内容。
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CHANNELS.map((ch) => (
          <button
            key={ch.value}
            onClick={() => setPlatform(ch.value)}
            className={`group relative p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${
              platform === ch.value
                ? ch.color
                : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted)]'
            }`}
          >
            {platform === ch.value && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                ✓
              </div>
            )}
            <div className="text-4xl mb-3">{ch.icon}</div>
            <div className="font-semibold text-lg mb-1">{ch.label}</div>
            <div className={`text-xs ${platform === ch.value ? ch.accentColor : 'text-[var(--muted)]'}`}>
              {ch.desc}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          className="px-8 py-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-medium transition-colors"
        >
          下一步 →
        </button>
      </div>
    </div>
  );
}
