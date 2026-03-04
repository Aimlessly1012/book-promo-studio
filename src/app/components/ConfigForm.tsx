'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import type { Platform, CopyType, MaterialType, LLMProvider } from '@/lib/claude';

// ---- 配置数据 ----
const CHANNELS: { value: Platform; icon: string; label: string }[] = [
  { value: 'facebook', icon: '📘', label: 'Facebook' },
  { value: 'google', icon: '🔍', label: 'Google' },
  { value: 'tiktok', icon: '🎵', label: 'TikTok' },
];

const COPY_TYPES: { value: CopyType; label: string; group: 'long' | 'short' }[] = [
  { value: '长-pov剧情', label: 'POV 剧情', group: 'long' },
  { value: '长-普通剧情', label: '普通剧情', group: 'long' },
  { value: '长-口播剧情', label: '口播剧情', group: 'long' },
  { value: '长-对话流', label: '对话流', group: 'long' },
  { value: '长-分镜脚本', label: '分镜脚本', group: 'long' },
  { value: '长-种草推书', label: '种草推书', group: 'long' },
  { value: '短-评论弹幕', label: '评论弹幕', group: 'short' },
  { value: '短-单句爆点', label: '单句爆点', group: 'short' },
  { value: '短-模拟信息', label: '模拟信息', group: 'short' },
];

const MATERIAL_TYPES: { value: MaterialType; icon: string; label: string }[] = [
  { value: '轮播视频', icon: '🎠', label: '轮播视频' },
  { value: '轮播图片', icon: '🖼️', label: '轮播图片' },
  { value: '解压', icon: '🧸', label: '解压' },
  { value: '滚屏漫画', icon: '📜', label: '滚屏漫画' },
];

const PROVIDERS: { value: LLMProvider; label: string }[] = [
  { value: 'minimax', label: 'MiniMax' },
  { value: 'claude', label: 'Claude' },
];

const ANGLE_OPTIONS = [1, 2, 3, 5, 8];

// ---- 组件 ----
export default function ConfigForm({ onSubmit }: { onSubmit: () => void }) {
  const store = useStore();
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    const text = await file.text();
    store.setNovelText(text);
  };

  const canSubmit = store.novelText.length >= 50;

  return (
    <div className="space-y-6">

      {/* 渠道 */}
      <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
        <p className="text-sm font-semibold mb-3 text-[var(--muted)]">📡 投放渠道</p>
        <div className="flex gap-2">
          {CHANNELS.map((ch) => (
            <button
              key={ch.value}
              onClick={() => store.setPlatform(ch.value)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                store.platform === ch.value
                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                  : 'border-[var(--border)] text-[var(--muted)] hover:border-indigo-400 hover:text-white'
              }`}
            >
              <span className="text-xl">{ch.icon}</span>
              <span>{ch.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 书籍内容 */}
      <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
        <p className="text-sm font-semibold mb-3 text-[var(--muted)]">📖 书籍内容</p>
        {/* 拖拽区 */}
        <div
          className={`border border-dashed rounded-xl p-3 text-center text-xs mb-3 cursor-pointer transition-colors ${
            dragActive
              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
              : 'border-[var(--border)] text-[var(--muted)] hover:border-indigo-400'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
        >
          📄 拖拽 .txt 文件到这里
        </div>
        <textarea
          className="w-full h-48 bg-transparent border border-[var(--border)] rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-indigo-500 transition-colors"
          placeholder={`粘贴书籍内容...\n\n书名、简介、目录、核心章节等`}
          value={store.novelText}
          onChange={(e) => store.setNovelText(e.target.value)}
        />
        <div className="flex items-center justify-between mt-2">
          <button
            disabled
            title="后期接入书籍接口"
            className="text-xs text-[var(--muted)] opacity-40 flex items-center gap-1 cursor-not-allowed"
          >
            🔗 从接口导入（即将上线）
          </button>
          <span className="text-xs text-[var(--muted)]">
            {store.novelText.length > 0 ? `${store.novelText.length} 字` : '≥ 50 字可提交'}
          </span>
        </div>
      </section>

      {/* 文案类型 */}
      <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
        <p className="text-sm font-semibold mb-3 text-[var(--muted)]">✍️ 文案类型</p>
        <div className="mb-2">
          <p className="text-xs text-[var(--muted)] mb-2">📝 长文案</p>
          <div className="flex flex-wrap gap-2">
            {COPY_TYPES.filter((c) => c.group === 'long').map((c) => (
              <button
                key={c.value}
                onClick={() => store.setCopyType(c.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  store.copyType === c.value
                    ? 'border-violet-500 bg-violet-500/15 text-violet-300'
                    : 'border-[var(--border)] text-[var(--muted)] hover:border-violet-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)] mb-2">⚡ 短文案</p>
          <div className="flex flex-wrap gap-2">
            {COPY_TYPES.filter((c) => c.group === 'short').map((c) => (
              <button
                key={c.value}
                onClick={() => store.setCopyType(c.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  store.copyType === c.value
                    ? 'border-violet-500 bg-violet-500/15 text-violet-300'
                    : 'border-[var(--border)] text-[var(--muted)] hover:border-violet-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 素材类型 */}
      <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
        <p className="text-sm font-semibold mb-3 text-[var(--muted)]">🎨 素材类型</p>
        <div className="grid grid-cols-2 gap-2">
          {MATERIAL_TYPES.map((m) => (
            <button
              key={m.value}
              onClick={() => store.setMaterialType(m.value)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                store.materialType === m.value
                  ? 'border-sky-500 bg-sky-500/10 text-white'
                  : 'border-[var(--border)] text-[var(--muted)] hover:border-sky-400 hover:text-white'
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 角度数量 + LLM */}
      <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
        <div className="flex items-start justify-between gap-6">
          {/* 角度数量 */}
          <div className="flex-1">
            <p className="text-sm font-semibold mb-3 text-[var(--muted)]">
              📐 广告角度数量
              <span className="ml-2 text-indigo-400 font-bold">{store.angleCount}</span>
            </p>
            <div className="flex items-center gap-1.5">
              {ANGLE_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => store.setAngleCount(n)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    store.angleCount === n
                      ? 'bg-indigo-500 text-white'
                      : 'bg-[var(--border)] text-[var(--muted)] hover:text-white hover:bg-indigo-500/40'
                  }`}
                >
                  {n}
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={20}
                value={store.angleCount}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 1 && v <= 20) store.setAngleCount(v);
                }}
                className="w-12 py-1.5 px-1 rounded-lg text-xs text-center bg-[var(--border)] focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
              />
            </div>
          </div>

          {/* LLM */}
          <div>
            <p className="text-sm font-semibold mb-3 text-[var(--muted)]">🤖 模型</p>
            <div className="flex flex-col gap-1.5">
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => store.setLLMProvider(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    store.llmProvider === p.value
                      ? 'border-indigo-500 bg-indigo-500 text-white'
                      : 'border-[var(--border)] text-[var(--muted)] hover:border-indigo-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 提交按钮 */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl font-semibold text-white transition-opacity shadow-lg shadow-indigo-500/20"
      >
        🚀 开始分析生成
      </button>
    </div>
  );
}
