import { NextRequest, NextResponse } from 'next/server';

// 代理：获取书籍免费章节内容
// GET /api/book/chapters?skuId=xxx  或 ?bookId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const skuId = searchParams.get('skuId') ?? '';
  const bookId = searchParams.get('bookId') ?? '';

  const baseUrl = process.env.BOOK_API_BASE_URL ?? 'https://ads.anynovel.app';
  const apiToken = process.env.BOOK_API_TOKEN ?? '';

  const url = new URL('/api/middlemanage/v1/landingpage/template/getfreechapters', baseUrl);
  if (skuId) url.searchParams.set('skuId', skuId);
  if (bookId) url.searchParams.set('bookId', bookId);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Accept-Language': 'zh-CN',
        ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
      },
    });

    const data = await res.json();
    console.log('[book/chapters] status:', res.status, 'chapters:', data?.data?.chapters?.length ?? 0);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[book/chapters] error:', message);
    return NextResponse.json({ code: 500, data: null, msg: message }, { status: 500 });
  }
}
