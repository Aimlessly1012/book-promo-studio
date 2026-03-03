'use client';

import { useCallback, useRef } from 'react';
import { useStore } from '@/lib/store';
import type { ImageAsset, VideoAsset } from '@/lib/store';
import type { GenerationMode } from '@/lib/store';
import StepIndicator from './components/StepIndicator';
import BookInput from './components/BookInput';
import KeywordPanel from './components/KeywordPanel';
import PromptPanel from './components/PromptPanel';
import AssetGallery from './components/AssetGallery';
import VideoGallery from './components/VideoGallery';
import ExportButton from './components/ExportButton';

export default function Home() {
  const store = useStore();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // ---- Step 1 → 2: 分析书籍 ----
  const handleAnalyze = useCallback(async () => {
    store.setStatus('analyzing');
    store.setStep(1);
    store.setError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelText: store.novelText, platform: store.platform, llmProvider: store.llmProvider }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const data = await res.json();
      store.setBookDNA(data.book_dna);
      store.setAdMaterials(data.ad_materials);
      store.setStep(2);
      store.setStatus('idle');
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [store]);

  // ---- Step 3: 生成图片（豆包） ----
  const handleGenerateImages = useCallback(async () => {
    const { adMaterials } = store;
    if (!adMaterials?.length) return;

    store.setStatus('generating_assets');
    store.setStep(3);
    store.setError(null);

    // 初始化图片列表 — 每个 ad angle 一张图
    const imgs: ImageAsset[] = adMaterials.map((mat, i) => ({
      id: `img-${i}`,
      angleIndex: i,
      angleName: mat.angle_name,
      prompt: mat.image_prompt,
      status: 'pending',
    }));

    store.setImages(imgs);

    // 串行逐张生成，避免限流
    for (const img of imgs) {
      store.updateImage(img.id, { status: 'generating' });
      try {
        const res = await fetch('/api/generate/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: img.prompt }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        store.updateImage(img.id, { status: 'done', url: data.url });
      } catch (err) {
        store.updateImage(img.id, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed',
        });
      }
    }

    store.setStep(4);
    store.setStatus('done');
  }, [store]);

  // ---- 一键生成全部（图片 + 视频）并发 ----
  const handleGenerateAll = useCallback(async () => {
    const { adMaterials } = store;
    if (!adMaterials?.length) return;

    store.setGenerationMode(null); // 不高亮任何单个卡片
    store.setStatus('generating_assets');
    store.setStep(3);
    store.setError(null);

    // 初始化图片 & 视频列表
    const imgs: ImageAsset[] = adMaterials.map((mat, i) => ({
      id: `img-${i}`, angleIndex: i, angleName: mat.angle_name, prompt: mat.image_prompt, status: 'pending',
    }));
    const vids: VideoAsset[] = adMaterials.map((mat, i) => ({
      id: `vid-${i}`, angleIndex: i, angleName: mat.angle_name, prompt: mat.video_prompt, status: 'pending', provider: 'doubao' as const,
    }));
    store.setImages(imgs);
    store.setVideos(vids);

    // 图片串行
    const genImages = async () => {
      for (const img of imgs) {
        store.updateImage(img.id, { status: 'generating' });
        try {
          const res = await fetch('/api/generate/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: img.prompt }) });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          store.updateImage(img.id, { status: 'done', url: data.url });
        } catch (err) {
          store.updateImage(img.id, { status: 'error', error: err instanceof Error ? err.message : 'Failed' });
        }
      }
    };

    // 视频串行提交
    const genVideos = async () => {
      const submitted: VideoAsset[] = [];
      for (const vid of vids) {
        store.updateVideo(vid.id, { status: 'generating' });
        try {
          const res = await fetch('/api/generate/video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: vid.prompt }) });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          store.updateVideo(vid.id, { status: 'polling', taskId: data.taskId });
          submitted.push({ ...vid, taskId: data.taskId, status: 'polling' });
        } catch (err) {
          store.updateVideo(vid.id, { status: 'error', error: err instanceof Error ? err.message : 'Failed' });
        }
      }
      if (submitted.length > 0) startVideoPolling();
    };

    // 并发执行，图片完成后如果视频也已提交则读取状态
    await Promise.all([genImages(), genVideos()]);
  }, [store]);

  // ---- Step 3: 生成视频（豆包 Seedance） ----
  const handleGenerateVideos = useCallback(async () => {
    const { adMaterials } = store;
    if (!adMaterials?.length) return;

    store.setStatus('generating_assets');
    store.setStep(3);
    store.setError(null);

    // 初始化视频列表
    const vids: VideoAsset[] = adMaterials.map((mat, i) => ({
      id: `vid-${i}`,
      angleIndex: i,
      angleName: mat.angle_name,
      prompt: mat.video_prompt,
      status: 'pending',
      provider: 'doubao' as const,
    }));
    store.setVideos(vids);

    // 串行提交任务
    const submitted: VideoAsset[] = [];
    for (const vid of vids) {
      store.updateVideo(vid.id, { status: 'generating' });
      try {
        const res = await fetch('/api/generate/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: vid.prompt }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        store.updateVideo(vid.id, { status: 'polling', taskId: data.taskId });
        submitted.push({ ...vid, taskId: data.taskId, status: 'polling' });
      } catch (err) {
        store.updateVideo(vid.id, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed',
        });
      }
    }

    // 开始轮询
    if (submitted.length > 0) startVideoPolling();
    else { store.setStep(4); store.setStatus('done'); }
  }, [store]);

  // ---- 视频任务轮询 ----
  const startVideoPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      const pendingVideos = useStore.getState().videos.filter(
        (v) => v.status === 'polling' && v.taskId
      );

      if (pendingVideos.length === 0) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        store.setStep(4);
        store.setStatus('done');
        return;
      }

      for (const vid of pendingVideos) {
        try {
          const res = await fetch(`/api/generate/video?taskId=${vid.taskId}`);
          const data = await res.json();
          if (data.error) {
            store.updateVideo(vid.id, { status: 'error', error: data.error });
          } else if (data.status === 'succeeded') {
            store.updateVideo(vid.id, { status: 'done', url: data.url });
          } else if (data.status === 'failed') {
            store.updateVideo(vid.id, { status: 'error', error: '生成失败' });
          }
          // queued/running → keep polling
        } catch {
          // Silently retry
        }
      }
    }, 10000);
  }, [store]);

  // ---- 重置 ----
  const handleReset = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    store.reset();
  }, [store]);

  const { step, status, error, generationMode } = store;

  return (
    <div className="min-h-screen p-4 sm:p-8">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold">
          📚 Book Promo Studio
        </h1>
        <p className="text-[var(--muted)] mt-2">
          书籍推广素材一站式生成 · Claude + 智谱 + MiniMax
        </p>
      </header>

      <StepIndicator current={step} />

      {/* Error banner */}
      {error && (
        <div className="max-w-3xl mx-auto mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          ❌ {error}
          <button onClick={handleReset} className="ml-4 underline hover:no-underline">
            重新开始
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {status === 'analyzing' && (
        <div className="max-w-3xl mx-auto mb-6 p-6 bg-[var(--card)] border border-[var(--border)] rounded-xl text-center">
          <div className="animate-pulse-glow text-4xl mb-3">🧠</div>
          <p className="text-lg font-medium">Claude 正在分析书籍内容...</p>
          <p className="text-sm text-[var(--muted)] mt-1">提取关键词 → 生成提示词，预计 30-60 秒</p>
        </div>
      )}

      {/* Step content */}
      {step === 0 && status !== 'analyzing' && (
        <BookInput onSubmit={handleAnalyze} />
      )}

      {step >= 2 && store.adMaterials && (
        <div className="mt-8">
          <KeywordPanel />

          {(step === 2 || (step >= 3 && status !== 'generating_assets')) && (
            <>
              <div className="mt-10 max-w-4xl mx-auto">
                <h3 className="text-center text-lg font-semibold mb-6">🚀 选择要生成的内容</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                  {/* 图片 */}
                  <button
                    onClick={() => {
                      store.setGenerationMode('image');
                      handleGenerateImages();
                    }}
                    disabled={status === 'generating_assets'}
                    className={`group p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                      generationMode === 'image'
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-[var(--border)] bg-[var(--card)] hover:border-indigo-400'
                    }`}
                  >
                    <div className="text-3xl mb-3">🖼️</div>
                    <div className="font-semibold text-base mb-1">推广图片</div>
                    <div className="text-xs text-[var(--muted)]">豆包 Seedream 4.5 生成，3 个广告角度</div>
                    <div className="text-xs text-indigo-400 mt-2">每张约 10-20 秒</div>
                  </button>

                  {/* 文案 */}
                  <button
                    onClick={() => store.setGenerationMode('copy')}
                    className={`group p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${
                      generationMode === 'copy'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-[var(--border)] bg-[var(--card)] hover:border-emerald-400'
                    }`}
                  >
                    <div className="text-3xl mb-3">✍️</div>
                    <div className="font-semibold text-base mb-1">广告文案</div>
                    <div className="text-xs text-[var(--muted)]">Hook · 正文 · CTA 、配音脚本</div>
                    <div className="text-xs text-emerald-400 mt-2">即时查看，无需生成</div>
                  </button>

                  {/* 视频 */}
                  <button
                    onClick={() => {
                      store.setGenerationMode('video');
                      handleGenerateVideos();
                    }}
                    disabled={status === 'generating_assets'}
                    className={`group p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                      generationMode === 'video'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-[var(--border)] bg-[var(--card)] hover:border-purple-400'
                    }`}
                  >
                    <div className="text-3xl mb-3">🎬</div>
                    <div className="font-semibold text-base mb-1">视频广告</div>
                    <div className="text-xs text-[var(--muted)]">豆包 Seedance 1.5 Pro 生成，3 个广告角度</div>
                    <div className="text-xs text-purple-400 mt-2">每条约 2-5 分钟</div>
                  </button>

                </div>
              </div>

              {/* 一键生成全部 */}
              <div className="mt-6 text-center">
                <div className="flex items-center gap-3 justify-center mb-4">
                  <div className="flex-1 h-px bg-[var(--border)]" />
                  <span className="text-xs text-[var(--muted)] px-2">或者</span>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>
                <button
                  onClick={handleGenerateAll}
                  disabled={status === 'generating_assets'}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-opacity shadow-lg shadow-purple-500/20"
                >
                  ⚡ 一键生成全部（图片 + 视频）
                </button>
                <p className="text-xs text-[var(--muted)] mt-2">图片 + 视频并发开始，完成后可一键导出</p>
              </div>
            </>
          )}

          {/* 根据选择显示不同内容 */}
          {generationMode === 'copy' && (
            <div className="mt-8">
              <PromptPanel />
            </div>
          )}
          {generationMode === 'video' && step >= 3 && (
            <div className="mt-8">
              {status === 'generating_assets' && (
                <div className="text-center mb-6 p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl max-w-xl mx-auto">
                  <div className="animate-pulse text-3xl mb-2">🎬</div>
                  <p className="text-sm text-[var(--muted)]">豆包正在生成视频，每条约 2-5 分钟，请耐心等候...</p>
                </div>
              )}
              <VideoGallery />
            </div>
          )}
          {generationMode === 'image' && step >= 3 && (
            <div className="mt-8">
              {status === 'generating_assets' && (
                <div className="text-center mb-6 p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl max-w-xl mx-auto">
                  <div className="animate-pulse text-3xl mb-2">🖼️</div>
                  <p className="text-sm text-[var(--muted)]">豆包正在生成图片，请稍候...</p>
                </div>
              )}
              <AssetGallery />
            </div>
          )}
          {/* 一键生成全部模式：同时显示图片和视频 */}
          {generationMode === null && step >= 3 && (
            <div className="mt-8 space-y-10">
              {status === 'generating_assets' && (
                <div className="text-center p-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl max-w-xl mx-auto">
                  <div className="animate-pulse text-3xl mb-2">⚡</div>
                  <p className="text-sm text-[var(--muted)]">图片和视频并发生成中，请稍候...</p>
                </div>
              )}
              <AssetGallery />
              <VideoGallery />
            </div>
          )}
        </div>
      )}


      {/* Done */}
      {status === 'done' && (
        <div className="text-center mt-8 p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl max-w-3xl mx-auto">
          <div className="text-4xl mb-3">🎉</div>
          <p className="text-lg font-medium text-emerald-400">
            {generationMode === 'video' ? '视频生成完成！' : generationMode === null ? '图片 + 视频全部完成！' : '图片生成完成！'}
          </p>
          <p className="text-sm text-[var(--muted)] mt-1">点击下方按鈕打包所有素材，按广告角度分层归档</p>
          <div className="mt-5 flex items-center justify-center gap-4 flex-wrap">
            <ExportButton />
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:bg-[var(--border)] transition-colors"
            >
              📖 分析另一本书
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
