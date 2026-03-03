'use client';

import { useStore } from '@/lib/store';

export default function AssetGallery() {
  const { images } = useStore();

  if (!images.length) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-center mb-6">🎨 生成图片</h2>

      {/* 图片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((img) => (
          <div
            key={img.id}
            className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden"
          >
            {img.status === 'done' && img.url ? (
              <>
                <img
                  src={img.url}
                  alt={img.angleName}
                  className="w-full aspect-square object-cover"
                />
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-indigo-400 mb-0.5">角度 {img.angleIndex + 1}</p>
                    <p className="text-sm font-medium truncate">{img.angleName}</p>
                  </div>
                  <a
                    href={img.url}
                    download={`image-${img.id}.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 ml-2 shrink-0"
                  >
                    ⬇️ 下载
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="w-full aspect-square flex items-center justify-center bg-black/30">
                  {img.status === 'error' ? (
                    <span className="text-red-400 text-sm px-4 text-center">❌ {img.error}</span>
                  ) : (
                    <div className="text-center">
                      <div className="animate-pulse text-3xl mb-2">🖼️</div>
                      <span className="text-xs text-[var(--muted)]">生成中...</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-indigo-400 mb-0.5">角度 {img.angleIndex + 1}</p>
                  <p className="text-sm font-medium truncate">{img.angleName}</p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
