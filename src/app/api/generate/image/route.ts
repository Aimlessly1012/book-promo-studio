import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { prompt, size } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: '请提供图片提示词' }, { status: 400 });
    }

    const apiKey = process.env.DOUBAO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'DOUBAO_API_KEY not set' }, { status: 500 });
    }

    // 豆包 ARK 图片生成接口（兼容 OpenAI images/generations 格式）
    const res = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'doubao-seedream-4-5-251128',
        prompt,
        size: size || '1440x2560',
        response_format: 'url',
        n: 1,
      }),
    });

    const data = await res.json();
    console.log('[doubao image] status:', res.status, 'response:', JSON.stringify(data).slice(0, 300));

    if (!res.ok || data.error) {
      throw new Error(data.error?.message || `Doubao API error ${res.status}`);
    }

    const url = data.data?.[0]?.url;
    if (!url) throw new Error('No image URL in response');

    return NextResponse.json({ url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Image generate error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
