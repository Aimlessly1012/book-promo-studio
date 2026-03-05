'use client';

import { useCallback, useRef } from 'react';
import { useStore } from '@/lib/store';
import type { ImageAsset, VideoAsset, MusicAsset } from '@/lib/store';
import ConfigForm from './components/ConfigForm';
import KeywordPanel from './components/KeywordPanel';
import PromptPanel from './components/PromptPanel';
import AssetGallery from './components/AssetGallery';
import VideoGallery from './components/VideoGallery';
import MusicGallery from './components/MusicGallery';
import ExportButton from './components/ExportButton';

export default function Home() {
  const store = useStore();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // ---- 分析书籍 ----
  const handleAnalyze = useCallback(async () => {
    // 用 getState() 保证读到最新值（避免 useCallback 闭包陈旧引用问题）
    const s = useStore.getState();

    store.setStatus('analyzing');
    store.setError(null);
    // 清空上次结果
    useStore.setState({ adMaterials: null, bookDNA: null, images: [], videos: [], generationMode: null });

    console.log('[handleAnalyze] angleCount:', s.angleCount, 'platform:', s.platform);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelText: s.novelText,
          platform: s.platform,
          llmProvider: s.llmProvider,
          copyType: s.copyType,
          materialType: s.materialType,
          angleCount: s.angleCount,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const data = await res.json();
      store.setBookDNA(data.book_dna);
      store.setAdMaterials(data.ad_materials);
      store.setStatus('idle');
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Unknown error');
      store.setStatus('idle');
    }
  }, [store]);

  // ---- 生成图片 ----
  const handleGenerateImages = useCallback(async () => {
    const { adMaterials } = store;
    if (!adMaterials?.length) return;

    store.setGenerationMode('image');
    store.setStatus('generating_assets');
    store.setError(null);

    const imgs: ImageAsset[] = adMaterials.map((mat, i) => ({
      id: `img-${i}`, angleIndex: i, angleName: mat.angle_name, prompt: mat.image_prompt, status: 'pending',
    }));
    store.setImages(imgs);

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
        store.updateImage(img.id, { status: 'error', error: err instanceof Error ? err.message : 'Failed' });
      }
    }
    store.setStatus('done');
  }, [store]);

  // ---- 生成视频（纯文本 to video）----
  const handleGenerateVideos = useCallback(async () => {
    const { adMaterials } = store;
    if (!adMaterials?.length) return;

    store.setGenerationMode('video');
    store.setStatus('generating_assets');
    store.setError(null);

    const vids: VideoAsset[] = adMaterials.map((mat, i) => ({
      id: `vid-${i}`, angleIndex: i, angleName: mat.angle_name, prompt: mat.video_prompt,
      status: 'pending', provider: 'doubao' as const,
    }));
    store.setVideos(vids);

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
        store.updateVideo(vid.id, { status: 'error', error: err instanceof Error ? err.message : 'Failed' });
      }
    }
    if (submitted.length > 0) startVideoPolling();
    else store.setStatus('done');
  }, [store]);

  // ---- 生成背景音乐 ----
  const handleGenerateMusic = useCallback(async () => {
    const { adMaterials } = store;
    if (!adMaterials?.length) return;

    store.setGenerationMode('music');
    store.setStatus('generating_assets');
    store.setError(null);

    const musics: MusicAsset[] = adMaterials.map((mat, i) => ({
      id: `music-${i}`,
      angleIndex: i,
      angleName: mat.angle_name,
      prompt: `适合${mat.angle_name}的背景音乐，轻快、温暖、鼓舞人心`,
      lyrics: '[instrumental]',
      status: 'pending',
    }));
    store.setMusics(musics);

    for (const music of musics) {
      store.updateMusic(music.id, { status: 'generating' });
      try {
        const res = await fetch('/api/generate/audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: music.prompt, lyrics: music.lyrics }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        // 将 base64 转为 blob URL
        const blob = await fetch(`data:audio/mpeg;base64,${data.audioBase64}`).then(r => r.blob());
        const audioUrl = URL.createObjectURL(blob);
        
        store.updateMusic(music.id, {
          status: 'done',
          audioUrl,
          audioDuration: data.duration,
        });
      } catch (err) {
        store.updateMusic(music.id, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed',
        });
      }
    }
    store.setStatus('done');
  }, [store]);

  // ---- 一键生成（先图片，再用图片生成视频）----
  const handleGenerateAll = useCallback(async () => {
    const { adMaterials } = store;
    if (!adMaterials?.length) return;

    store.setGenerationMode(null);
    store.setStatus('generating_assets');
    store.setError(null);

    const imgs: ImageAsset[] = adMaterials.map((mat, i) => ({
      id: `img-${i}`, angleIndex: i, angleName: mat.angle_name, prompt: mat.image_prompt, status: 'pending',
    }));
    const vids: VideoAsset[] = adMaterials.map((mat, i) => ({
      id: `vid-${i}`, angleIndex: i, angleName: mat.angle_name, prompt: mat.video_prompt,
      status: 'pending', provider: 'doubao' as const,
    }));
    store.setImages(imgs);
    store.setVideos(vids);

    // Step 1: 生成图片
    const imageUrls: Record<string, string> = {};
    for (const img of imgs) {
      store.updateImage(img.id, { status: 'generating' });
      try {
        const res = await fetch('/api/generate/image', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: img.prompt }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        store.updateImage(img.id, { status: 'done', url: data.url });
        imageUrls[img.id] = data.url;
      } catch (err) {
        store.updateImage(img.id, { status: 'error', error: err instanceof Error ? err.message : 'Failed' });
      }
    }

    // Step 2: 用图片 URL 生成视频
    const submitted: VideoAsset[] = [];
    for (const vid of vids) {
      const imageUrl = imageUrls[`img-${vid.angleIndex}`];
      store.updateVideo(vid.id, { status: 'generating', sourceImageUrl: imageUrl });
      try {
        const res = await fetch('/api/generate/video', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: vid.prompt, imageUrl }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        store.updateVideo(vid.id, { status: 'polling', taskId: data.taskId });
        submitted.push({ ...vid, taskId: data.taskId, status: 'polling' });
      } catch (err) {
        store.updateVideo(vid.id, { status: 'error', error: err instanceof Error ? err.message : 'Failed' });
      }
    }
    if (submitted.length > 0) startVideoPolling();
  }, [store]);

  // ---- 单图转视频 ----
  const handleImageToVideo = useCallback(async (img: ImageAsset) => {
    if (!img.url) return;
    const { adMaterials } = store;
    const videoPrompt = adMaterials?.[img.angleIndex]?.video_prompt ?? '';
    const vidId = `vid-img-${img.id}`;
    const newVid = {
      id: vidId, angleIndex: img.angleIndex, angleName: img.angleName,
      prompt: videoPrompt, sourceImageUrl: img.url,
      status: 'generating' as const, provider: 'doubao' as const,
    };
    const currentVideos = useStore.getState().videos;
    const exists = currentVideos.find((v) => v.id === vidId);
    if (!exists) {
      store.setVideos([...currentVideos, newVid]);
    } else {
      store.updateVideo(vidId, { status: 'generating', error: undefined });
    }
    store.setGenerationMode('video');
    try {
      const res = await fetch('/api/generate/video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: videoPrompt, imageUrl: img.url }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      store.updateVideo(vidId, { status: 'polling', taskId: data.taskId });
      startVideoPolling();
    } catch (err) {
      store.updateVideo(vidId, { status: 'error', error: err instanceof Error ? err.message : 'Failed' });
    }
  }, [store]);

  // ---- 视频轮询 ----
  const startVideoPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      const pendingVideos = useStore.getState().videos.filter((v) => v.status === 'polling' && v.taskId);
      if (pendingVideos.length === 0) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        store.setStatus('done');
        return;
      }
      for (const vid of pendingVideos) {
        try {
          const res = await fetch(`/api/generate/video?taskId=${vid.taskId}`);
          const data = await res.json();
          if (data.error) {
            store.updateVideo(vid.id, { status: 'error', error: data.error });
          } else if (data.status === 'succeeded' && data.url) {
            // 视频生成完成 → 自动烧录字幕
            store.updateVideo(vid.id, { status: 'burning', url: data.url });
            const adMats = useStore.getState().adMaterials;
            const mat = adMats?.[vid.angleIndex];
            if (mat) {
              try {
                const burnRes = await fetch('/api/generate/burn-subtitle', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    videoUrl: data.url,
                    hook: mat.copywriting.hook,
                    body: mat.copywriting.body,
                    cta: mat.copywriting.cta,
                    angleName: mat.angle_name,
                    subtitleStyle: mat.subtitle_style,
                  }),
                });
                const burnData = await burnRes.json();
                if (burnData.videoBase64) {
                  const blob = await fetch(`data:video/mp4;base64,${burnData.videoBase64}`).then(r => r.blob());
                  const burnedUrl = URL.createObjectURL(blob);
                  store.updateVideo(vid.id, { status: 'done', url: burnedUrl });
                } else {
                  // 烧录失败，用原始视频
                  console.warn('[burn-subtitle] failed, using original:', burnData.error);
                  store.updateVideo(vid.id, { status: 'done', url: data.url });
                }
              } catch (burnErr) {
                console.warn('[burn-subtitle] error, using original:', burnErr);
                store.updateVideo(vid.id, { status: 'done', url: data.url });
              }
            } else {
              store.updateVideo(vid.id, { status: 'done', url: data.url });
            }
          } else if (data.status === 'failed') {
            store.updateVideo(vid.id, { status: 'error', error: '生成失败' });
          }
        } catch { /* retry */ }
      }
    }, 10000);
  }, [store]);

  // ---- 重置结果（保留配置） ----
  const handleClearResults = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    useStore.setState({ adMaterials: null, bookDNA: null, images: [], videos: [], musics: [], generationMode: null, status: 'idle', error: null });
  }, [store]);

  const { status, error, generationMode } = store;
  const isAnalyzing = status === 'analyzing';
  const isGenerating = (useStore.getState().status as string) === 'generating_assets';
  const hasResults = !!store.adMaterials;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* Header */}
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold">📚 Book Promo Studio</h1>
        <p className="text-[var(--muted)] mt-1 text-sm">书籍推广素材一站式生成 · Claude + MiniMax</p>
      </header>

      {/* Error banner */}
      {error && (
        <div className="max-w-5xl mx-auto mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3">
          <span>❌ {error}</span>
          <button onClick={() => store.setError(null)} className="ml-auto underline hover:no-underline shrink-0">关闭</button>
        </div>
      )}

      {/* Main layout: left form + right results */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start">

        {/* ---- 左栏：配置表单（固定宽度，sticky） ---- */}
        <div className="w-full lg:w-[380px] lg:shrink-0 lg:sticky lg:top-6">
          <ConfigForm onSubmit={handleAnalyze} />
        </div>

        {/* ---- 右栏：结果区 ---- */}
        <div className="flex-1 min-w-0">

          {/* 未分析时的空状态 */}
          {!hasResults && !isAnalyzing && (
            <div className="flex flex-col items-center justify-center h-72 text-center text-[var(--muted)] border-2 border-dashed border-[var(--border)] rounded-2xl">
              <div className="text-5xl mb-4">🧠</div>
              <p className="text-base font-medium">填写左侧配置，点击「开始分析生成」</p>
              <p className="text-sm mt-1">AI 将根据书籍内容生成差异化广告素材</p>
            </div>
          )}

          {/* 分析中 */}
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center h-72 text-center border border-[var(--border)] rounded-2xl bg-[var(--card)]">
              <div className="animate-pulse text-5xl mb-4">🧠</div>
              <p className="text-base font-medium">AI 正在分析书籍内容...</p>
              <p className="text-sm text-[var(--muted)] mt-1">
                {store.platform} · {store.copyType} · {store.materialType} · {store.angleCount} 个角度
              </p>
              <p className="text-xs text-[var(--muted)] mt-2">预计 30-60 秒</p>
            </div>
          )}

          {/* 有结果后 */}
          {hasResults && !isAnalyzing && (
            <div className="space-y-6">
              {/* 关键词面板 */}
              <KeywordPanel />

              {/* Tab 切换条 + 操作按钮 */}
              <div className="flex items-center gap-1 border-b border-[var(--border)] pb-0">
                {[
                  { key: 'copy', icon: '✍️', label: '广告文案' },
                  { key: 'image', icon: '🖼️', label: '推广图片' },
                  { key: 'video', icon: '🎬', label: '视频广告' },
                  { key: 'music', icon: '🎵', label: '背景音乐' },
                ] .map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => store.setGenerationMode(tab.key as 'copy' | 'image' | 'video' | 'music')}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      generationMode === tab.key
                        ? 'border-indigo-500 text-white'
                        : 'border-transparent text-[var(--muted)] hover:text-white'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}

                <div className="flex-1" />

                {/* 操作按钮 */}
                {!isGenerating && (
                  <div className="flex items-center gap-2 pb-1">
                    {generationMode === 'music' && (
                      <button
                        onClick={handleGenerateMusic}
                        className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 rounded-lg text-xs font-semibold text-white transition-opacity shadow-sm"
                      >
                        🎵 生成背景音乐
                      </button>
                    )}
                    {generationMode !== 'music' && (
                      <button
                        onClick={handleGenerateAll}
                        className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 rounded-lg text-xs font-semibold text-white transition-opacity shadow-sm"
                      >
                        ⚡ 一键生成
                      </button>
                    )}
                    <button
                      onClick={handleClearResults}
                      className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs text-[var(--muted)] hover:text-white transition-colors"
                    >
                      🔄 清空
                    </button>
                  </div>
                )}
                {isGenerating && (
                  <div className="flex items-center gap-2 pb-1 text-xs text-[var(--muted)]">
                    <div className="animate-pulse">⚡</div>
                    <span>
                      {generationMode === 'image' ? '生成图片中...'
                        : generationMode === 'video' ? '生成视频中...'
                        : generationMode === 'music' ? '生成音乐中...'
                        : '图片 → 视频 生成中...'}
                    </span>
                  </div>
                )}
              </div>

              {/* Tab 内容面板 */}
              <div className="pt-2">
                {generationMode === 'copy' && <PromptPanel />}
                {generationMode === 'image' && <AssetGallery onImageToVideo={handleImageToVideo} />}
                {generationMode === 'video' && <VideoGallery />}
                {generationMode === 'music' && <MusicGallery />}
                {(generationMode === null || generationMode === undefined) && (
                  <div className="text-center text-[var(--muted)] text-sm py-12">
                    点击上方 Tab 查看对应内容，或点击「⚡ 一键生成」生成图片和视频
                  </div>
                )}
              </div>

              {/* 导出 */}
              {status === 'done' && (
                <div className="flex items-center justify-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <span className="text-emerald-400 text-sm font-medium">🎉 生成完成！</span>
                  <ExportButton />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
