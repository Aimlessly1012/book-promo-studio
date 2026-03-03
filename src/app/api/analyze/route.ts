import { NextRequest, NextResponse } from 'next/server';
import { generateAdMaterials } from '@/lib/claude';
import type { LLMProvider } from '@/lib/claude';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { novelText, platform, llmProvider } = await req.json();
    if (!novelText || typeof novelText !== 'string') {
      return NextResponse.json({ error: '请提供书籍内容' }, { status: 400 });
    }

    // 一步生成：分析小说 + 生成全部素材提示词
    const result = await generateAdMaterials(novelText, platform, llmProvider as LLMProvider);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Analyze error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
