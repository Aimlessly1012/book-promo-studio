'use client';

import { useStore } from '@/lib/store';

export default function AssetGallery() {
  const { images, videos, audios } = useStore();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-center mb-6">🎨 生成素材</h2>

      {/* 图片 */}
      {images.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">🖼️ 图片</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden"
              >
                {img.status === 'done' && img.url ? (
                  <img
                    src={img.url}
                    alt={img.scene}
                    className="w-full aspect-square object-cover"
                  />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center bg-black/30">
                    {img.status === 'error' ? (
                      <span className="text-[var(--error)] text-sm">❌ {img.error}</span>
                    ) : (
                      <div className="text-center">
                        <div className="animate-pulse-glow text-3xl mb-2">🖼️</div>
                        <span className="text-xs text-[var(--muted)]">生成中...</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{img.scene}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">{img.style}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 视频 */}
      {videos.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">🎬 视频</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {videos.map((vid) => (
              <div
                key={vid.id}
                className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden"
              >
                {vid.status === 'done' && vid.url ? (
                  <video
                    src={vid.url}
                    controls
                    className="w-full aspect-video"
                  />
                ) : (
                  <div className="w-full aspect-video flex items-center justify-center bg-black/30">
                    {vid.status === 'error' ? (
                      <span className="text-[var(--error)] text-sm">❌ {vid.error}</span>
                    ) : (
                      <div className="text-center">
                        <div className="animate-pulse-glow text-3xl mb-2">🎬</div>
                        <span className="text-xs text-[var(--muted)]">
                          {vid.status === 'polling' ? '处理中...' : '排队中...'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{vid.scene}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      vid.provider === 'zhipu'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-purple-500/20 text-purple-300'
                    }`}>
                      {vid.provider === 'zhipu' ? 'CogVideoX' : 'Hailuo'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-1">{vid.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 音频 */}
      {audios.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">🔊 音频</h3>
          <div className="space-y-3">
            {audios.map((aud) => (
              <div
                key={aud.id}
                className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-emerald-400">{aud.type}</span>
                      <span className="text-xs text-[var(--muted)]">{aud.voice} · {aud.emotion}</span>
                    </div>
                    <p className="text-sm text-[var(--muted)]">{aud.text}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {aud.status === 'done' && aud.audioUrl ? (
                      <audio src={aud.audioUrl} controls className="h-8" />
                    ) : aud.status === 'error' ? (
                      <span className="text-[var(--error)] text-xs">❌</span>
                    ) : (
                      <div className="animate-pulse-glow text-xl">🔊</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
