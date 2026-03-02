import { NextRequest, NextResponse } from 'next/server';
import { cogviewGenerate } from '@/lib/zhipu';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { prompt, size } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: '请提供图片提示词' }, { status: 400 });
    }

    const result = await cogviewGenerate(prompt, size || '1024x1024');
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Image generate error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
