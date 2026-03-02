'use client';

import { useStore } from '@/lib/store';

export default function PromptPanel() {
  const { prompts } = useStore();
  if (!prompts) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-center mb-6">✍️ 生成的提示词</h2>

      {/* 图片提示词 */}
      <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          🖼️ 图片提示词 <span className="text-xs text-[var(--muted)]">CogView-4</span>
        </h3>
        <div className="space-y-3">
          {prompts.imagePrompts.map((ip, i) => (
            <div key={i} className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-indigo-400">场景 {i + 1}:</span>
                <span className="text-sm">{ip.scene}</span>
                <span className="ml-auto px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-xs">
                  {ip.style}
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] font-mono break-all">{ip.prompt}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 视频提示词 */}
      <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          🎬 视频提示词 <span className="text-xs text-[var(--muted)]">CogVideoX / Hailuo</span>
        </h3>
        <div className="space-y-3">
          {prompts.videoPrompts.map((vp, i) => (
            <div key={i} className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-purple-400">片段 {i + 1}:</span>
                <span className="text-sm">{vp.scene}</span>
                <span className="ml-auto text-xs text-[var(--muted)]">{vp.duration}</span>
              </div>
              <p className="text-xs text-[var(--muted)] font-mono break-all">{vp.prompt}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 音乐提示词 */}
      <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          🎵 背景音乐 <span className="text-xs text-[var(--muted)]">MiniMax Music-1.5</span>
        </h3>
        <div className="space-y-3">
          {prompts.musicPrompts.map((mp, i) => (
            <div key={i} className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-emerald-400">曲目 {i + 1}:</span>
                <span className="text-sm">{mp.scene}</span>
                <span className="ml-auto px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-xs">
                  {mp.mood}
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] font-mono break-all mb-2">
                <span className="text-emerald-400/60">风格:</span> {mp.prompt}
              </p>
              <p className="text-xs text-[var(--muted)] whitespace-pre-line">
                <span className="text-emerald-400/60">歌词:</span> {mp.lyrics}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
