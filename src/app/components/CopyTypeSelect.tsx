'use client';

import { useStore } from '@/lib/store';
import type { CopyType } from '@/lib/claude';

type Group = { label: string; icon: string; items: { value: CopyType; label: string; desc: string }[] };

const GROUPS: Group[] = [
  {
    label: '长文案',
    icon: '📝',
    items: [
      { value: '长-pov剧情', label: 'POV 剧情', desc: '第一人称代入感，读者视角叙事' },
      { value: '长-普通剧情', label: '普通剧情', desc: '旁白叙事，矛盾冲突递进' },
      { value: '长-口播剧情', label: '口播剧情', desc: '适合人声配音的节奏感语句' },
      { value: '长-对话流', label: '对话流', desc: '角色对话形式，冲突 & 揭秘' },
      { value: '长-分镜脚本', label: '分镜脚本', desc: '带时长的分镜格式，竖版视频' },
      { value: '长-种草推书', label: '种草推书', desc: '推书博主风格，主观体验' },
    ],
  },
  {
    label: '短文案',
    icon: '⚡',
    items: [
      { value: '短-评论弹幕', label: '评论弹幕', desc: '模拟热门评论 / 弹幕' },
      { value: '短-单句爆点', label: '单句爆点', desc: '1-2句，最强情绪冲击' },
      { value: '短-模拟信息', label: '模拟信息', desc: '模拟聊天截图 / 消息气泡' },
    ],
  },
];

export default function CopyTypeSelect({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { copyType, setCopyType } = useStore();

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">✍️ 选择文案类型</h2>
      <p className="text-[var(--muted)] mb-8">
        不同类型的文案适合不同的内容形态和投放场景，AI 会按所选格式生成对应结构的文本。
      </p>

      <div className="space-y-8">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{group.icon}</span>
              <span className="font-semibold text-base">{group.label}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {group.items.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setCopyType(item.value)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.01] ${
                    copyType === item.value
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted)]'
                  }`}
                >
                  {copyType === item.value && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center text-[10px] text-white">
                      ✓
                    </div>
                  )}
                  <div className={`font-medium mb-1 ${copyType === item.value ? 'text-violet-300' : ''}`}>
                    {item.label}
                  </div>
                  <div className="text-xs text-[var(--muted)]">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button onClick={onBack} className="px-6 py-2.5 border border-[var(--border)] rounded-xl text-sm hover:bg-[var(--card)] transition-colors">
          ← 上一步
        </button>
        <button
          onClick={onNext}
          className="px-8 py-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-medium transition-colors"
        >
          下一步 →
        </button>
      </div>
    </div>
  );
}
