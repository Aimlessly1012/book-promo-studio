import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Book Promo Studio | 书籍推广素材工作站',
  description: '一站式书籍推广素材生成：关键词提取 → 提示词生成 → 图片/视频/音频批量生成',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
