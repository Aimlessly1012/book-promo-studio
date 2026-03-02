'use client';

import { useStore } from '@/lib/store';

function formatDuration(ms: number) {
  const s = Math.round(ms / 1000);
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function AssetGallery() {
  const { images, videos, musics } = useStore();

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
                      <span className="text-[var(--error)] text-sm px-4 text-center">❌ {img.error}</span>
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
                      <span className="text-[var(--error)] text-sm px-4 text-center">❌ {vid.error}</span>
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

      {/* 背景音乐 */}
      {musics.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">🎵 背景音乐</h3>
          <div className="space-y-3">
            {musics.map((mus) => (
              <div
                key={mus.id}
                className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-emerald-400">{mus.scene}</span>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-xs">
                        {mus.mood}
                      </span>
                      {mus.audioDuration && (
                        <span className="text-xs text-[var(--muted)]">
                          {formatDuration(mus.audioDuration)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)] mb-1">
                      <span className="text-emerald-400/60">风格:</span> {mus.prompt}
                    </p>
                    <p className="text-xs text-[var(--muted)] whitespace-pre-line">
                      <span className="text-emerald-400/60">歌词:</span> {mus.lyrics.substring(0, 100)}
                      {mus.lyrics.length > 100 ? '...' : ''}
                    </p>
                  </div>
                  <div className="flex-shrink-0 pt-1">
                    {mus.status === 'done' && mus.audioUrl ? (
                      <div className="space-y-2">
                        <audio src={mus.audioUrl} controls className="h-8 w-48" />
                        <a
                          href={mus.audioUrl}
                          download={`music-${mus.id}.mp3`}
                          className="block text-center text-xs text-indigo-400 hover:text-indigo-300"
                        >
                          ⬇️ 下载 MP3
                        </a>
                      </div>
                    ) : mus.status === 'error' ? (
                      <span className="text-[var(--error)] text-xs">❌ {mus.error}</span>
                    ) : (
                      <div className="text-center w-48">
                        <div className="animate-pulse-glow text-2xl">🎵</div>
                        <span className="text-xs text-[var(--muted)]">生成中（约1-2分钟）</span>
                      </div>
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
