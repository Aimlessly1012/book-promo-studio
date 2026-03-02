'use client';

import { useCallback, useRef } from 'react';
import { useStore } from '@/lib/store';
import type { ImageAsset, VideoAsset, MusicAsset } from '@/lib/store';
import StepIndicator from './components/StepIndicator';
import BookInput from './components/BookInput';
import KeywordPanel from './components/KeywordPanel';
import PromptPanel from './components/PromptPanel';
import AssetGallery from './components/AssetGallery';

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
        body: JSON.stringify({ bookContent: store.bookContent }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const data = await res.json();
      store.setKeywords(data.keywords);
      store.setPrompts(data.prompts);
      store.setStep(2);
      store.setStatus('generating_prompts');
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [store]);

  // ---- Step 3: 批量生成素材 ----
  const handleGenerate = useCallback(async () => {
    const { prompts } = store;
    if (!prompts) return;

    store.setStatus('generating_assets');
    store.setStep(3);

    // 初始化资产列表
    const imgs: ImageAsset[] = prompts.imagePrompts.map((ip, i) => ({
      id: `img-${i}`,
      scene: ip.scene,
      prompt: ip.prompt,
      style: ip.style,
      status: 'pending',
    }));

    const vids: VideoAsset[] = prompts.videoPrompts.map((vp, i) => ({
      id: `vid-${i}`,
      scene: vp.scene,
      prompt: vp.prompt,
      duration: vp.duration,
      status: 'pending',
      provider: i % 2 === 0 ? 'zhipu' : 'minimax',
    }));

    const musics: MusicAsset[] = prompts.musicPrompts.map((mp, i) => ({
      id: `mus-${i}`,
      scene: mp.scene,
      prompt: mp.prompt,
      lyrics: mp.lyrics,
      mood: mp.mood,
      status: 'pending',
    }));

    store.setImages(imgs);
    store.setVideos(vids);
    store.setMusics(musics);

    // 并发生成图片（串行逐张，避免限流）
    const genImages = async () => {
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
    };

    // 提交视频任务
    const genVideos = async () => {
      for (const vid of vids) {
        store.updateVideo(vid.id, { status: 'generating' });
        try {
          const res = await fetch('/api/generate/video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: vid.prompt, provider: vid.provider }),
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          store.updateVideo(vid.id, { status: 'polling', taskId: data.taskId });
        } catch (err) {
          store.updateVideo(vid.id, {
            status: 'error',
            error: err instanceof Error ? err.message : 'Failed',
          });
        }
      }
    };

    // 生成背景音乐（串行，每首约1-2分钟）
    const genMusics = async () => {
      for (const mus of musics) {
        store.updateMusic(mus.id, { status: 'generating' });
        try {
          const res = await fetch('/api/generate/audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: mus.prompt, lyrics: mus.lyrics }),
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          const audioUrl = `data:${data.mimeType};base64,${data.audioBase64}`;
          store.updateMusic(mus.id, {
            status: 'done',
            audioUrl,
            audioDuration: data.duration,
          });
        } catch (err) {
          store.updateMusic(mus.id, {
            status: 'error',
            error: err instanceof Error ? err.message : 'Failed',
          });
        }
      }
    };

    // 并发执行三类生成
    await Promise.all([genImages(), genVideos(), genMusics()]);

    // 启动视频轮询
    startVideoPolling();
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
        checkAllDone();
        return;
      }

      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tasks: pendingVideos.map((v) => ({ taskId: v.taskId, provider: v.provider })),
          }),
        });
        const data = await res.json();

        data.results?.forEach((r: { taskId?: string; status?: string; url?: string; error?: string }, idx: number) => {
          const vid = pendingVideos[idx];
          if (!vid) return;
          if (r.error) {
            store.updateVideo(vid.id, { status: 'error', error: r.error });
          } else if (r.status === 'SUCCESS' || r.status === 'Success') {
            store.updateVideo(vid.id, { status: 'done', url: r.url });
          }
        });

        // 轮询后再检查是否全部完成
        checkAllDone();
      } catch {
        // Silently retry
      }
    }, 10000);
  }, [store]);

  const checkAllDone = useCallback(() => {
    const state = useStore.getState();
    const allDone =
      state.images.every((i) => i.status === 'done' || i.status === 'error') &&
      state.videos.every((v) => v.status === 'done' || v.status === 'error') &&
      state.musics.every((m) => m.status === 'done' || m.status === 'error');
    if (allDone && state.status === 'generating_assets') {
      store.setStep(4);
      store.setStatus('done');
    }
  }, [store]);

  // ---- 重置 ----
  const handleReset = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    store.reset();
  }, [store]);

  const { step, status, error } = store;

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

      {step >= 2 && <KeywordPanel />}

      {step >= 2 && store.prompts && (
        <div className="mt-8">
          <PromptPanel />
          {step === 2 && (
            <div className="text-center mt-8">
              <button
                onClick={handleGenerate}
                className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-lg font-medium text-lg transition-colors"
              >
                🚀 开始批量生成素材
              </button>
              <p className="text-xs text-[var(--muted)] mt-2">
                图片约 10 秒/张 · 视频约 2-5 分钟 · 音乐约 1-2 分钟/首
              </p>
            </div>
          )}
        </div>
      )}

      {step >= 3 && (
        <div className="mt-8">
          <AssetGallery />
        </div>
      )}

      {/* Done */}
      {status === 'done' && (
        <div className="text-center mt-8 p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl max-w-3xl mx-auto">
          <div className="text-4xl mb-3">🎉</div>
          <p className="text-lg font-medium text-emerald-400">全部素材生成完成！</p>
          <p className="text-sm text-[var(--muted)] mt-1">图片可右键保存 · 音乐可直接播放和下载 · 视频可在线预览</p>
          <button
            onClick={handleReset}
            className="mt-4 px-6 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--border)] transition-colors"
          >
            📖 分析另一本书
          </button>
        </div>
      )}
    </div>
  );
}
