/**
 * MiniMax API 封装
 * - Speech-02 语音合成 (T2A)
 * - Video-01 视频生成
 */

const MINIMAX_BASE = 'https://api.minimaxi.com/v1';

function getHeaders() {
  const key = process.env.MINIMAX_API_KEY;
  if (!key) throw new Error('MINIMAX_API_KEY not set');
  return {
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

// ---- 语音合成 (T2A V2) ----
export interface TTSOptions {
  text: string;
  voiceId?: string;  // male-qn-qingse, female-shaonv, etc.
  speed?: number;    // 0.5 - 2.0
  model?: string;
}

export async function minimaxTTS(opts: TTSOptions) {
  const { text, voiceId = 'male-qn-qingse', speed = 1.0, model = 'speech-02-hd' } = opts;
  const res = await fetch(`${MINIMAX_BASE}/t2a_v2`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model,
      text,
      voice_setting: {
        voice_id: voiceId,
        speed,
      },
    }),
  });
  if (!res.ok) throw new Error(`MiniMax TTS error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  if (data.base_resp?.status_code !== 0) {
    throw new Error(`MiniMax TTS failed: ${data.base_resp?.status_msg}`);
  }
  // data.data.audio 是 hex 编码的 MP3
  return {
    audioHex: data.data.audio as string,
    duration: data.extra_info?.audio_length as number,
    traceId: data.trace_id,
  };
}

// 将 hex 编码转为 Buffer
export function hexToBuffer(hex: string): Buffer {
  return Buffer.from(hex, 'hex');
}

// ---- 视频生成 (Hailuo Video-01) ----
export async function minimaxVideoGenerate(prompt: string, model = 'video-01') {
  const res = await fetch(`${MINIMAX_BASE}/video_generation`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ model, prompt }),
  });
  if (!res.ok) throw new Error(`MiniMax Video error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  if (data.base_resp?.status_code !== 0) {
    throw new Error(`MiniMax Video failed: ${data.base_resp?.status_msg}`);
  }
  return {
    taskId: data.task_id as string,
  };
}

// ---- 查询视频任务状态 ----
export async function minimaxVideoQuery(taskId: string) {
  const res = await fetch(`${MINIMAX_BASE}/query/video_generation?task_id=${taskId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`MiniMax Video query error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return {
    status: data.status as string,  // Preparing, Processing, Success, Fail
    fileId: data.file_id as string | undefined,
    downloadUrl: data.file_id ? `${MINIMAX_BASE}/files/retrieve?file_id=${data.file_id}` : undefined,
  };
}
