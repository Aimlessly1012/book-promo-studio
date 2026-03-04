import { NextRequest, NextResponse } from 'next/server';

// 代理书籍下拉搜索接口，避免浏览器跨域
// GET /api/book/search?key=xxx&type=2
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const key = searchParams.get('key') ?? '';
  const type = searchParams.get('type') ?? '2'; // 默认按 bookskuid 搜索

  const baseUrl = process.env.BOOK_API_BASE_URL ?? 'https://ads.anynovel.app';
  const apiToken = process.env.BOOK_API_TOKEN ?? '';

  const url = new URL('/api/middlemanage/v1/landingpage/bookinfo/droplistbykey', baseUrl);
  if (key) url.searchParams.set('key', key);
  url.searchParams.set('type', type);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Accept-Language': 'zh-CN',
        ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
      },
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[book/search] error:', message);
    return NextResponse.json({ code: 500, data: null, msg: message }, { status: 500 });
  }
}
