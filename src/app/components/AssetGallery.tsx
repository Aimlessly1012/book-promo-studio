'use client';

import { useStore } from '@/lib/store';
import type { ImageAsset } from '@/lib/store';

interface AssetGalleryProps {
  onImageToVideo?: (img: ImageAsset) => void;
}

export default function AssetGallery({ onImageToVideo }: AssetGalleryProps) {
  const { images, videos } = useStore();

  if (!images.length) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-center mb-6">🎨 生成图片</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((img) => {
          // 找到这张图对应角度是否已有视频任务
          const relatedVideo = videos.find(
            (v) => v.sourceImageUrl === img.url && v.url
          );
          const isGeneratingVideo = videos.some(
            (v) => v.sourceImageUrl === img.url &&
              (v.status === 'generating' || v.status === 'polling')
          );

          return (
            <div
              key={img.id}
              className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden"
            >
              {img.status === 'done' && img.url ? (
                <>
                  <div className="relative group">
                    <img
                      src={img.url}
                      alt={img.angleName}
                      className="w-full aspect-square object-cover"
                    />
                    {/* hover 叠层：图生视频按钮 */}
                    {onImageToVideo && !isGeneratingVideo && !relatedVideo && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => onImageToVideo(img)}
                          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium text-sm text-white transition-colors shadow-lg"
                        >
                          🎬 用此图生成视频
                        </button>
                      </div>
                    )}
                    {/* 生成中状态叠层 */}
                    {isGeneratingVideo && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-pulse text-3xl mb-1">🎬</div>
                          <p className="text-xs text-purple-300">视频生成中...</p>
                        </div>
                      </div>
                    )}
                    {/* 视频已完成标记 */}
                    {relatedVideo && (
                      <div className="absolute top-2 right-2 bg-purple-600/90 text-white text-xs px-2 py-1 rounded-full">
                        ✓ 视频已生成
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-indigo-400 mb-0.5">角度 {img.angleIndex + 1}</p>
                      <p className="text-sm font-medium truncate">{img.angleName}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      {/* 图生视频按钮（小按钮，始终可见） */}
                      {onImageToVideo && (
                        <button
                          onClick={() => !isGeneratingVideo && !relatedVideo && onImageToVideo(img)}
                          disabled={isGeneratingVideo || !!relatedVideo}
                          title={relatedVideo ? '视频已生成' : isGeneratingVideo ? '视频生成中...' : '用此图生成视频'}
                          className="text-xs px-2 py-1 rounded-lg border border-purple-500/50 text-purple-400 hover:bg-purple-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {relatedVideo ? '✓ 已生成' : isGeneratingVideo ? '生成中...' : '🎬 转视频'}
                        </button>
                      )}
                      <a
                        href={img.url}
                        download={`image-${img.id}.png`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        ⬇️ 下载
                      </a>
                    </div>
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
          );
        })}
      </div>
    </div>
  );
}
