import { NextRequest, NextResponse } from 'next/server';
import { minimaxTTS, hexToBuffer } from '@/lib/minimax';

export const maxDuration = 30;

// 语音合成
export async function POST(req: NextRequest) {
  try {
    const { text, voiceId, speed } = await req.json();
    if (!text) {
      return NextResponse.json({ error: '请提供文本内容' }, { status: 400 });
    }

    const result = await minimaxTTS({ text, voiceId, speed });
    const audioBuffer = hexToBuffer(result.audioHex);
    const audioBase64 = audioBuffer.toString('base64');

    return NextResponse.json({
      audioBase64,
      duration: result.duration,
      mimeType: 'audio/mpeg',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Audio generate error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
