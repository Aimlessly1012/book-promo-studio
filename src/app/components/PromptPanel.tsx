'use client';

import { useStore } from '@/lib/store';

export default function PromptPanel() {
  const { adMaterials } = useStore();
  if (!adMaterials?.length) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-center">✍️ 广告素材提示词</h2>

      {adMaterials.map((mat, i) => (
        <div key={i} className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          {/* 角度标题 */}
          <div className="px-6 py-4 border-b border-[var(--border)] bg-indigo-500/10">
            <div className="text-xs text-indigo-400 mb-0.5">广告角度 {i + 1}</div>
            <h3 className="font-semibold text-lg">{mat.angle_name}</h3>
          </div>

          <div className="p-6 space-y-6">
            {/* 文案 */}
            <div>
              <h4 className="text-sm font-medium text-indigo-300 mb-2">📝 文案</h4>
              <div className="bg-black/30 rounded-lg p-4 space-y-2 text-sm">
                <div><span className="text-[var(--muted)]">Hook：</span>{mat.copywriting.hook}</div>
                <div><span className="text-[var(--muted)]">正文：</span>{mat.copywriting.body}</div>
                <div><span className="text-[var(--muted)]">CTA：</span>{mat.copywriting.cta}</div>
              </div>
            </div>

            {/* 配音脚本 */}
            <div>
              <h4 className="text-sm font-medium text-purple-300 mb-2">🎙️ 配音脚本</h4>
              <div className="bg-black/30 rounded-lg p-4 space-y-2 text-sm">
                <div><span className="text-[var(--muted)]">音色：</span>{mat.voiceover_prompt.voice_profile}</div>
                <div className="text-[var(--muted)] text-xs font-mono whitespace-pre-wrap mt-2">
                  {mat.voiceover_prompt.script_with_pauses}
                </div>
              </div>
            </div>

            {/* 图片 & 视频提示词 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-amber-300 mb-2">🖼️ 图片提示词</h4>
                <p className="bg-black/30 rounded-lg p-3 text-xs text-[var(--muted)] font-mono break-all">
                  {mat.image_prompt}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-amber-300 mb-2">🎬 视频提示词</h4>
                <p className="bg-black/30 rounded-lg p-3 text-xs text-[var(--muted)] font-mono break-all">
                  {mat.video_prompt}
                </p>
              </div>
            </div>

            {/* 音乐 */}
            <div>
              <h4 className="text-sm font-medium text-emerald-300 mb-2">🎵 背景音乐</h4>
              <div className="bg-black/30 rounded-lg p-4 space-y-2 text-sm">
                <div><span className="text-[var(--muted)] text-xs">风格：</span><span className="text-xs font-mono">{mat.bgm_prompt}</span></div>
                <div className="text-xs text-[var(--muted)] whitespace-pre-wrap mt-1">{mat.bgm_lyrics}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
