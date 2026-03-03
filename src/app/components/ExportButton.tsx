'use client';

import { useState } from 'react';
import JSZip from 'jszip';
import { useStore } from '@/lib/store';

export default function ExportButton() {
  const { adMaterials, bookDNA, images, videos } = useStore();
  const [exporting, setExporting] = useState(false);

  // 只要有任意素材已生成就可以导出
  const hasAssets =
    images.some((i) => i.status === 'done') ||
    videos.some((v) => v.status === 'done');

  if (!adMaterials || !hasAssets) return null;

  const handleExport = async () => {
    if (!adMaterials) return;
    setExporting(true);

    try {
      const zip = new JSZip();

      // 顶层：书籍 DNA
      if (bookDNA) {
        zip.file('book_dna.json', JSON.stringify(bookDNA, null, 2));
      }

      // 每个广告角度一个文件夹
      for (let i = 0; i < adMaterials.length; i++) {
        const mat = adMaterials[i];
        // 目录名：序号 + 角度名，去除非法字符
        const dirName = `Angle${i + 1}_${mat.angle_name.replace(/[/\\?%*:|"<>]/g, '_')}`;
        const folder = zip.folder(dirName)!;

        // 1. 文案 copywriting.txt
        const copyText = [
          `=== Hook ===\n${mat.copywriting.hook}`,
          `=== Body ===\n${mat.copywriting.body}`,
          `=== CTA ===\n${mat.copywriting.cta}`,
          `\n=== Voiceover Profile ===\n${mat.voiceover_prompt.voice_profile}`,
          `=== Voiceover Script ===\n${mat.voiceover_prompt.script_with_pauses}`,
        ].join('\n\n');
        folder.file('copywriting.txt', copyText);

        // 2. 提示词 prompts.txt
        const promptText = [
          `=== Image Prompt ===\n${mat.image_prompt}`,
          `=== Video Prompt ===\n${mat.video_prompt}`,
          `=== BGM Prompt ===\n${mat.bgm_prompt}`,
          `=== BGM Lyrics ===\n${mat.bgm_lyrics}`,
        ].join('\n\n');
        folder.file('prompts.txt', promptText);

        // 3. 图片（如果已生成，fetch 二进制）
        const img = images.find((img) => img.angleIndex === i && img.status === 'done' && img.url);
        if (img?.url) {
          try {
            const imgRes = await fetch(img.url);
            const blob = await imgRes.blob();
            const ext = blob.type.includes('png') ? 'png' : 'jpg';
            folder.file(`image.${ext}`, blob);
          } catch {
            folder.file('image_url.txt', img.url);
          }
        }

        // 4. 视频（文件通常很大，仅存 URL 引用）
        const vid = videos.find((v) => v.angleIndex === i && v.status === 'done' && v.url);
        if (vid?.url) {
          folder.file('video_url.txt', vid.url);
        }
      }

      // 生成 ZIP 并触发下载
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `book-promo-assets.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
      alert('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
    >
      {exporting ? (
        <>
          <span className="animate-spin">⏳</span> 打包中...
        </>
      ) : (
        <>
          📦 一键导出素材包
        </>
      )}
    </button>
  );
}
