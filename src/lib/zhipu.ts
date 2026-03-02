/**
 * 智谱 API 封装
 * - GLM-4 文本生成
 * - CogView-4 图片生成
 * - CogVideoX 视频生成
 */

const ZHIPU_BASE = 'https://open.bigmodel.cn/api/paas/v4';

function getHeaders() {
  const key = process.env.ZHIPU_API_KEY;
  if (!key) throw new Error('ZHIPU_API_KEY not set');
  return {
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

// ---- 文本生成 (GLM-4) ----
export async function glmChat(messages: { role: string; content: string }[], model = 'glm-4-plus') {
  const res = await fetch(`${ZHIPU_BASE}/chat/completions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ model, messages, temperature: 0.7 }),
  });
  if (!res.ok) throw new Error(`GLM chat error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ---- 图片生成 (CogView-4) ----
export async function cogviewGenerate(prompt: string, size = '1024x1024') {
  const res = await fetch(`${ZHIPU_BASE}/images/generations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ model: 'cogview-4', prompt, size }),
  });
  if (!res.ok) throw new Error(`CogView error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return {
    url: data.data?.[0]?.url ?? '',
    id: data.id,
  };
}

// ---- 视频生成 (CogVideoX) ----
export async function cogvideoGenerate(prompt: string, model = 'cogvideox-2') {
  const res = await fetch(`${ZHIPU_BASE}/videos/generations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ model, prompt }),
  });
  if (!res.ok) throw new Error(`CogVideo error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return {
    taskId: data.id,
    status: data.task_status,
  };
}

// ---- 查询异步任务状态 ----
export async function zhipuQueryTask(taskId: string) {
  const res = await fetch(`${ZHIPU_BASE}/async-result/${taskId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Task query error: ${res.status} ${await res.text()}`);
  return res.json();
}
