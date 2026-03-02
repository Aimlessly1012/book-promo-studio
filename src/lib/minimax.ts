/**
 * MiniMax API 封装
 * - Music-1.5 背景音乐生成
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

// ---- 背景音乐生成 (Music-1.5) ----
export interface MusicOptions {
  prompt: string;    // 风格描述: "Peaceful piano, warm, inspiring"
  lyrics: string;    // 歌词或 [instrumental] 标签
  format?: string;   // mp3 | wav | pcm
  sampleRate?: number;
  bitrate?: number;
}

export async function minimaxMusicGenerate(opts: MusicOptions) {
  const {
    prompt,
    lyrics,
    format = 'mp3',
    sampleRate = 32000,
    bitrate = 128000,
  } = opts;

  const res = await fetch(`${MINIMAX_BASE}/music_generation`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: 'music-1.5',
      prompt,
      lyrics,
      audio_setting: {
        sample_rate: sampleRate,
        bitrate,
        format,
      },
    }),
  });

  if (!res.ok) throw new Error(`MiniMax Music error: ${res.status} ${await res.text()}`);
  const data = await res.json();

  if (data.base_resp?.status_code !== 0) {
    throw new Error(`MiniMax Music failed: ${data.base_resp?.status_msg}`);
  }

  return {
    audioHex: data.data.audio as string,
    duration: data.extra_info?.music_duration as number,   // ms
    sampleRate: data.extra_info?.music_sample_rate as number,
    size: data.extra_info?.music_size as number,
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
    status: data.status as string,
    fileId: data.file_id as string | undefined,
    downloadUrl: data.file_id ? `${MINIMAX_BASE}/files/retrieve?file_id=${data.file_id}` : undefined,
  };
}
