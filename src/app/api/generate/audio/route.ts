import { NextRequest, NextResponse } from 'next/server';
import { minimaxMusicGenerate, hexToBuffer } from '@/lib/minimax';

export const maxDuration = 180; // 音乐生成最长可能需要 3 分钟

// 背景音乐生成
export async function POST(req: NextRequest) {
  try {
    const { prompt, lyrics } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: '请提供音乐风格描述' }, { status: 400 });
    }
    if (!lyrics) {
      return NextResponse.json({ error: '请提供歌词或 [instrumental] 标签' }, { status: 400 });
    }

    const result = await minimaxMusicGenerate({ prompt, lyrics });
    const audioBuffer = hexToBuffer(result.audioHex);
    const audioBase64 = audioBuffer.toString('base64');

    return NextResponse.json({
      audioBase64,
      duration: result.duration,
      size: result.size,
      mimeType: 'audio/mpeg',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Music generate error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
