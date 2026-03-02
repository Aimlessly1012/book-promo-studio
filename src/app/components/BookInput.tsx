'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';

export default function BookInput({ onSubmit }: { onSubmit: () => void }) {
  const { bookContent, setBookContent } = useStore();
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
        placeholder="在这里粘贴书籍内容...&#10;&#10;例如：书名、作者、简介、目录、核心章节内容等"
        value={bookContent}
        onChange={(e) => setBookContent(e.target.value)}
      />

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-[var(--muted)]">
          {bookContent.length > 0 ? `${bookContent.length} 字` : '等待输入...'}
        </span>
        <button
          onClick={onSubmit}
          disabled={bookContent.length < 50}
          className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
        >
          开始分析 →
        </button>
      </div>
    </div>
  );
}
