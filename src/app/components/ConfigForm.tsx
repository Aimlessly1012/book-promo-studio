'use client';

import { useState, useRef, useCallback } from 'react';
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

// 书籍搜索结果类型（来自 BookDropDto，id=skuId，bookId 单独字段）
interface BookOption {
  id: string;       // API 返回的 id（通常为 skuId）
  name: string;
  language: string;
  bookId?: string;  // 若 API 额外返回 bookId
  skuId?: string;   // 若 API 额外返回 skuId（备用）
}

// ---- 书籍下拉搜索子组件 ----
function BookSearchSection() {
  const store = useStore();
  const [keyword, setKeyword] = useState('');
  const [options, setOptions] = useState<BookOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);
  const [searchError, setSearchError] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 搜索书籍（防抖 400ms）
  const handleSearch = useCallback((value: string) => {
    setKeyword(value);
    setSearchError('');
    if (!value.trim()) {
      setOptions([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/book/search?key=${encodeURIComponent(value)}&type=2`);
        const json = await res.json();
        const list: BookOption[] = Array.isArray(json.data)
          ? json.data.map((item: Record<string, string>) => ({
              id: item.id ?? '',
              name: item.name ?? '',
              language: item.language ?? '',
              bookId: item.bookId ?? item.book_id ?? undefined,
              skuId: item.skuId ?? item.sku_id ?? item.id ?? undefined,
            }))
          : [];
        setOptions(list);
        setShowDropdown(true);
      } catch {
        setSearchError('搜索失败，请检查网络');
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  // 选中书籍
  const handleSelect = (book: BookOption) => {
    setSelectedBook(book);
    setKeyword(book.name);
    setShowDropdown(false);
    // 清空已有内容，等用户点获取
    store.setNovelText('');
  };

  // 获取书籍免费章节内容
  const handleFetchContent = async () => {
    if (!selectedBook) return;
    setFetching(true);
    setSearchError('');
    try {
      // 优先使用明确的 bookId 和 skuId 字段，fallback 到 id
      const bookId = selectedBook.bookId ?? selectedBook.id;
      const skuId = selectedBook.skuId ?? selectedBook.id;
      const params = new URLSearchParams();
      if (bookId) params.set('bookId', bookId);
      if (skuId) params.set('skuId', skuId);

      const res = await fetch(`/api/book/chapters?${params.toString()}`);
      const json = await res.json();

      if (json.code !== 200 || !json.data) {
        throw new Error(json.msg || '获取章节失败');
      }

      const { chapters, cover } = json.data as {
        chapters: { title: string; order: number; chapterContent: string }[];
        cover?: string;
      };

      if (!chapters || chapters.length === 0) {
        throw new Error('该书暂无免费章节内容');
      }

      const sorted = [...chapters].sort((a, b) => a.order - b.order);
      const lines: string[] = [
        `书名：${selectedBook.name}`,
        `语言：${selectedBook.language}`,
        cover ? `封面：${cover}` : '',
        '',
        ...sorted.flatMap((ch) => [
          `【第 ${ch.order} 章】${ch.title}`,
          ch.chapterContent ?? '',
          '',
        ]),
      ].filter((l, i) => !(l === '' && i === 2));

      store.setNovelText(lines.join('\n'));
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : '获取内容失败');
    } finally {
      setFetching(false);
    }
  };

  return (
    <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
      <p className="text-sm font-semibold mb-3 text-[var(--muted)]">📖 书籍</p>

      {/* 搜索 + 选中书籍 */}
      <div className="relative mb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={keyword}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => options.length > 0 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="输入书籍名称或 SKUID 搜索..."
              className="w-full px-3 py-2 bg-transparent border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] animate-pulse">
                搜索中...
              </div>
            )}
          </div>

          {/* 获取书籍内容按钮 */}
          <button
            onClick={handleFetchContent}
            disabled={!selectedBook || fetching}
            title={!selectedBook ? '请先搜索并选择书籍' : '获取书籍内容'}
            className="shrink-0 px-3 py-2 rounded-xl text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-indigo-500/60 text-indigo-400 hover:bg-indigo-500/10"
          >
            {fetching ? '获取中...' : '📥 获取内容'}
          </button>
        </div>

        {/* 下拉列表 */}
        {showDropdown && options.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1a1a2e] border border-[var(--border)] rounded-xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto">
            {options.map((book) => (
              <button
                key={book.id}
                onMouseDown={() => handleSelect(book)}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-indigo-500/10 transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-medium text-white">{book.name}</span>
                  <span className="ml-2 text-xs text-[var(--muted)]">{book.id}</span>
                </div>
                <span className="text-xs text-[var(--muted)] shrink-0 ml-2">{book.language}</span>
              </button>
            ))}
          </div>
        )}
        {showDropdown && !loading && options.length === 0 && keyword && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1a1a2e] border border-[var(--border)] rounded-xl px-4 py-3 text-xs text-[var(--muted)] shadow-2xl">
            未找到相关书籍
          </div>
        )}
      </div>

      {/* 已选书籍标签 */}
      {selectedBook && (
        <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
          <span className="text-xs text-indigo-300">✓ 已选：</span>
          <span className="text-xs font-medium text-white truncate">{selectedBook.name}</span>
          <span className="text-xs text-[var(--muted)]">#{selectedBook.id}</span>
          <button
            onClick={() => { setSelectedBook(null); setKeyword(''); store.setNovelText(''); }}
            className="ml-auto text-xs text-[var(--muted)] hover:text-white"
          >✕</button>
        </div>
      )}

      {searchError && (
        <p className="text-xs text-red-400 mb-2">⚠️ {searchError}</p>
      )}

      {/* 手动输入区（备用） */}
      <textarea
        className="w-full h-36 bg-transparent border border-[var(--border)] rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-indigo-500 transition-colors"
        placeholder={`也可直接粘贴书籍内容...\n\n书名、简介、目录、核心章节等`}
        value={store.novelText}
        onChange={(e) => store.setNovelText(e.target.value)}
      />
      <div className="flex items-center justify-end mt-1">
        <span className="text-xs text-[var(--muted)]">
          {store.novelText.length > 0 ? `${store.novelText.length} 字` : '≥ 50 字可提交'}
        </span>
      </div>
    </section>
  );
}

// ---- 主组件 ----
export default function ConfigForm({ onSubmit }: { onSubmit: () => void }) {
  const store = useStore();
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

      {/* 书籍搜索 */}
      <BookSearchSection />

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
