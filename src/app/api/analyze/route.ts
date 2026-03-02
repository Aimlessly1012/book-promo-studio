import { NextRequest, NextResponse } from 'next/server';
import { extractKeywords, generatePromoPrompts } from '@/lib/claude';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { bookContent } = await req.json();
    if (!bookContent || typeof bookContent !== 'string') {
      return NextResponse.json({ error: '请提供书籍内容' }, { status: 400 });
    }

    // Step 1: 提取关键词
    const keywords = await extractKeywords(bookContent);

    // Step 2: 生成提示词
    const prompts = await generatePromoPrompts(keywords);

    return NextResponse.json({ keywords, prompts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Analyze error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
