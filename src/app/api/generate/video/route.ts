import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

function getDoubaoKey() {
  const apiKey = process.env.DOUBAO_API_KEY;
  if (!apiKey) throw new Error('DOUBAO_API_KEY not set');
  return apiKey;
}

// 提交视频生成任务（支持纯文本 & 图片+文本两种模式）
export async function POST(req: NextRequest) {
  try {
    const { prompt, imageUrl } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: '请提供视频提示词' }, { status: 400 });
    }

    const apiKey = getDoubaoKey();

    // 构建 content 数组：如果有 imageUrl，图片放首位作为参考帧
    const content: { type: string; text?: string; image_url?: { url: string } }[] = [];
    if (imageUrl) {
      content.push({ type: 'image_url', image_url: { url: imageUrl } });
    }
    content.push({ type: 'text', text: prompt });

    const res = await fetch('https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'doubao-seedance-1-5-pro-251215',
        content,
        duration: 10,
      }),
    });

    const data = await res.json();
    const mode = imageUrl ? 'image-to-video' : 'text-to-video';
    console.log(`[doubao video submit] mode: ${mode}, status:`, res.status, JSON.stringify(data).slice(0, 300));

    if (!res.ok || data.error) {
      throw new Error(data.error?.message || `Doubao API error ${res.status}`);
    }

    const taskId = data.id;
    if (!taskId) throw new Error('No task ID in response');

    return NextResponse.json({ taskId, provider: 'doubao', mode });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Video generate error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


// 查询视频任务状态
export async function GET(req: NextRequest) {
  try {
    const taskId = req.nextUrl.searchParams.get('taskId');
    if (!taskId) {
      return NextResponse.json({ error: '请提供 taskId' }, { status: 400 });
    }

    const apiKey = getDoubaoKey();

    const res = await fetch(
      `https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/${taskId}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    const data = await res.json();
    console.log('[doubao video query] taskId:', taskId, 'status:', data.status);

    if (!res.ok || data.error) {
      throw new Error(data.error?.message || `Query error ${res.status}`);
    }

    // status: 'queued' | 'running' | 'succeeded' | 'failed'
    const status = data.status;
    const url = data.content?.video_url ?? data.output?.video_url ?? null;

    return NextResponse.json({ status, url, taskId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Video query error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
