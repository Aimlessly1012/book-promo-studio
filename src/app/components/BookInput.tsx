'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import type { LLMProvider } from '@/lib/claude';

const PROVIDERS: { value: LLMProvider; label: string; badge: string }[] = [
  { value: 'minimax', label: 'MiniMax', badge: 'MiniMax-Text-01' },
  { value: 'claude', label: 'Claude', badge: 'claude-sonnet-4-5' },
];

export default function BookInput({ onSubmit, onBack }: { onSubmit: () => void; onBack: () => void }) {
  const { novelText: bookContent, setNovelText: setBookContent, llmProvider, setLLMProvider } = useStore();
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    const text = await file.text();
    setBookContent(text);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">📖 输入书籍内容</h2>
      <p className="text-[var(--muted)] mb-6">
        粘贴书籍文本、简介、目录或关键章节。内容越丰富，提取的关键词和生成的素材越精准。
      </p>

      {/* 拖拽区域 */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center mb-4 transition-colors ${
          dragActive
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-[var(--border)] hover:border-[var(--muted)]'
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
        <p className="text-[var(--muted)]">
          📄 拖拽 .txt 文件到这里，或直接在下方输入
        </p>
      </div>

      <textarea
        className="w-full h-64 bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-indigo-500 transition-colors"
        placeholder={`在这里粘贴书籍内容...\n\n例如：书名、作者、简介、目录、核心章节内容等`}
        value={bookContent}
        onChange={(e) => setBookContent(e.target.value)}
      />

      {/* 导入接口入口（占位，后期接入接口） */}
      <div className="mt-3 flex items-center gap-2">
        <button
          disabled
          title="后期接入书籍接口，自动导入书籍内容"
          className="flex items-center gap-1.5 px-4 py-2 border border-dashed border-[var(--border)] rounded-lg text-xs text-[var(--muted)] cursor-not-allowed opacity-50"
        >
          🔗 从接口导入书籍（即将上线）
        </button>
        <span className="text-[10px] text-[var(--muted)]">调用书籍接口自动填充内容</span>
      </div>

      {/* 字数 + 模型选择 + 操作按钮 */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-[var(--muted)]">
          {bookContent?.length > 0 ? `${bookContent?.length} 字` : '等待输入...'}
        </span>

        <div className="flex items-center gap-3">
          {/* LLM Provider Toggle */}
          <div className="flex items-center gap-1 bg-[var(--card)] border border-[var(--border)] rounded-lg p-1">
            {PROVIDERS.map((p) => (
              <button
                key={p.value}
                onClick={() => setLLMProvider(p.value)}
                title={p.badge}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  llmProvider === p.value
                    ? 'bg-indigo-500 text-white'
                    : 'text-[var(--muted)] hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button onClick={onBack} className="px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--card)] transition-colors">
            ← 返回
          </button>
          <button
            onClick={onSubmit}
            disabled={bookContent?.length < 50}
            className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            下一步 →
          </button>
        </div>
      </div>
    </div>
  );
}
