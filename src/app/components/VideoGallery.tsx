'use client';

import { useStore } from '@/lib/store';

export default function VideoGallery() {
  const { videos } = useStore();

  if (!videos.length) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">🎬 生成视频</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((vid) => (
          <div
            key={vid.id}
            className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden"
          >
            {vid.status === 'done' && vid.url ? (
              <>
                <video
                  src={vid.url}
                  controls
                  className="w-full aspect-[9/16] object-cover"
                />
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-purple-400 mb-0.5">角度 {vid.angleIndex + 1}</p>
                    <p className="text-sm font-medium truncate">{vid.angleName}</p>
                  </div>
                  <a
                    href={vid.url}
                    download={`video-${vid.id}.mp4`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-purple-400 hover:text-purple-300 ml-2 shrink-0"
                  >
                    ⬇️ 下载
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="w-full aspect-[9/16] flex items-center justify-center bg-black/30">
                  {vid.status === 'error' ? (
                    <span className="text-red-400 text-sm px-4 text-center">❌ {vid.error}</span>
                  ) : (
                    <div className="text-center">
                      <div className="animate-pulse text-4xl mb-3">🎬</div>
                      <span className="text-xs text-[var(--muted)]">
                        {vid.status === 'polling' ? '生成中（约 10-15 秒）...' : '提交中...'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-purple-400 mb-0.5">角度 {vid.angleIndex + 1}</p>
                  <p className="text-sm font-medium truncate">{vid.angleName}</p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
