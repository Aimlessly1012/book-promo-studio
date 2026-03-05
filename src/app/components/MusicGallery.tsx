'use client';

import { useStore } from '@/lib/store';

export default function MusicGallery() {
  const { musics } = useStore();

  if (musics.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--muted)]">
        <div className="text-4xl mb-3">🎵</div>
        <p className="text-sm">点击下方「生成背景音乐」按钮开始</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {musics.map((music) => (
        <div
          key={music.id}
          className="border border-[var(--border)] rounded-xl p-4 bg-[var(--card)] hover:border-indigo-500/50 transition-colors"
        >
          {/* 角度名称 */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-indigo-400">
              角度 {music.angleIndex + 1}
            </span>
            <span className="text-sm font-medium truncate">{music.angleName}</span>
          </div>

          {/* 提示词 */}
          <div className="text-xs text-[var(--muted)] mb-3 line-clamp-2">
            {music.prompt}
          </div>

          {/* 状态 */}
          {music.status === 'pending' && (
            <div className="text-xs text-[var(--muted)]">⏳ 等待生成...</div>
          )}
          {music.status === 'generating' && (
            <div className="text-xs text-yellow-400 animate-pulse">🎵 生成中...</div>
          )}
          {music.status === 'error' && (
            <div className="text-xs text-red-400">❌ {music.error || '生成失败'}</div>
          )}
          {music.status === 'done' && music.audioUrl && (
            <div className="space-y-2">
              <audio
                controls
                src={music.audioUrl}
                className="w-full h-8"
                style={{ maxHeight: '32px' }}
              />
              {music.audioDuration && (
                <div className="text-xs text-[var(--muted)]">
                  时长: {(music.audioDuration / 1000).toFixed(1)}s
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
