import { NextRequest, NextResponse } from 'next/server';
import { generateAdMaterials } from '@/lib/claude';
import type { LLMProvider, CopyType, MaterialType } from '@/lib/claude';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { novelText, platform, llmProvider, copyType, materialType, angleCount } = await req.json();
    if (!novelText || typeof novelText !== 'string') {
      return NextResponse.json({ error: '请提供书籍内容' }, { status: 400 });
    }

    // 一步生成：分析小说 + 生成全部素材提示词
    const result = await generateAdMaterials(
      novelText,
      platform,
      llmProvider as LLMProvider,
      copyType as CopyType,
      materialType as MaterialType,
      typeof angleCount === 'number' ? angleCount : 3
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Analyze error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
