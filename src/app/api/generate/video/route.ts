import { NextRequest, NextResponse } from 'next/server';
import { cogvideoGenerate, zhipuQueryTask } from '@/lib/zhipu';
import { minimaxVideoGenerate, minimaxVideoQuery } from '@/lib/minimax';

export const maxDuration = 30;

// 提交视频生成任务
export async function POST(req: NextRequest) {
  try {
    const { prompt, provider = 'zhipu' } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: '请提供视频提示词' }, { status: 400 });
    }

    if (provider === 'minimax') {
      const result = await minimaxVideoGenerate(prompt);
      return NextResponse.json({ taskId: result.taskId, provider: 'minimax' });
    } else {
      const result = await cogvideoGenerate(prompt);
      return NextResponse.json({ taskId: result.taskId, provider: 'zhipu', status: result.status });
    }
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
    const provider = req.nextUrl.searchParams.get('provider') || 'zhipu';

    if (!taskId) {
      return NextResponse.json({ error: '请提供 taskId' }, { status: 400 });
    }

    if (provider === 'minimax') {
      const result = await minimaxVideoQuery(taskId);
      return NextResponse.json(result);
    } else {
      const result = await zhipuQueryTask(taskId);
      return NextResponse.json({
        status: result.task_status,
        url: result.video_result?.[0]?.url,
        coverUrl: result.video_result?.[0]?.cover_image_url,
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Video query error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
