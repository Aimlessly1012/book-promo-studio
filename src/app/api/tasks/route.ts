import { NextRequest, NextResponse } from 'next/server';
import { zhipuQueryTask } from '@/lib/zhipu';
import { minimaxVideoQuery } from '@/lib/minimax';

export const maxDuration = 10;

// 批量查询任务状态
export async function POST(req: NextRequest) {
  try {
    const { tasks } = await req.json() as {
      tasks: { taskId: string; provider: string }[];
    };

    const results = await Promise.allSettled(
      tasks.map(async (t) => {
        if (t.provider === 'minimax') {
          const r = await minimaxVideoQuery(t.taskId);
          return { taskId: t.taskId, provider: 'minimax', ...r };
        } else {
          const r = await zhipuQueryTask(t.taskId);
          return {
            taskId: t.taskId,
            provider: 'zhipu',
            status: r.task_status,
            url: r.video_result?.[0]?.url,
            coverUrl: r.video_result?.[0]?.cover_image_url,
          };
        }
      })
    );

    return NextResponse.json({
      results: results.map((r) =>
        r.status === 'fulfilled' ? r.value : { error: (r.reason as Error).message }
      ),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
