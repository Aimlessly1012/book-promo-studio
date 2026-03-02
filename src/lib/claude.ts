/**
 * Claude API 封装 — 书籍分析 & 提示词生成
 */

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1';

function getHeaders() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');
  return {
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
    'Content-Type': 'application/json',
  };
}

export async function claudeChat(systemPrompt: string, userMessage: string, model = 'claude-sonnet-4-20250514') {
  const res = await fetch(`${ANTHROPIC_BASE}/messages`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!res.ok) throw new Error(`Claude error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

// ---- 书籍关键词提取 ----
export async function extractKeywords(bookContent: string) {
  const system = `你是一位专业的图书营销策划专家。你的任务是从书籍内容中提取最具吸引力的关键词和卖点。

请按以下格式输出 JSON：
{
  "title": "书名",
  "coreTheme": "核心主题（一句话）",
  "keywords": [
    { "word": "关键词", "emotion": "情绪标签", "weight": 1-10 }
  ],
  "sellingPoints": ["卖点1", "卖点2", ...],
  "targetAudience": ["目标人群1", ...],
  "emotionalHooks": ["情感钩子1", ...],
  "goldenQuotes": ["金句1", ...]
}

要求：
- keywords 提取 15-20 个，按吸引力排序
- sellingPoints 提取 5-8 个核心卖点
- emotionalHooks 提取能引发共鸣的情感钩子
- goldenQuotes 提取书中最精彩的原句
- 所有内容面向推广投放场景优化`;

  const result = await claudeChat(system, `请分析以下书籍内容：\n\n${bookContent}`);
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return result;
}

// ---- 生成推广提示词 ----
export interface PromoPrompts {
  imagePrompts: { scene: string; prompt: string; style: string }[];
  videoPrompts: { scene: string; prompt: string; duration: string }[];
  musicPrompts: { scene: string; prompt: string; lyrics: string; mood: string }[];
}

export async function generatePromoPrompts(keywords: Record<string, unknown>): Promise<PromoPrompts> {
  const system = `你是一位专业的AI内容创作提示词工程师。基于书籍分析结果，生成用于 AI 生成的提示词。

请输出 JSON 格式：
{
  "imagePrompts": [
    {
      "scene": "场景描述（中文）",
      "prompt": "英文图片生成提示词（适配 CogView-4，详细描述画面构图、色调、风格）",
      "style": "风格标签"
    }
  ],
  "videoPrompts": [
    {
      "scene": "场景描述（中文）",
      "prompt": "英文视频生成提示词（适配 CogVideoX，描述运镜、动作、氛围）",
      "duration": "建议时长"
    }
  ],
  "musicPrompts": [
    {
      "scene": "使用场景（中文，如：推广视频背景音乐、书店氛围音乐）",
      "prompt": "英文音乐风格描述（适配 MiniMax Music-1.5，描述风格、乐器、节奏、情绪，10-300字符）",
      "lyrics": "歌词内容，支持结构标签 [Intro][Verse][Chorus][Bridge][Outro]。纯器乐可用 [Intro]\\n[instrumental]\\n[Outro]。有歌词时每行用换行分隔，10-600字符",
      "mood": "情绪标签"
    }
  ]
}

要求：
- imagePrompts 生成 5-8 张不同场景的图片提示词
- videoPrompts 生成 3-5 个视频片段提示词
- musicPrompts 生成 3-5 段背景音乐
  * 至少 1 段纯器乐（用 [instrumental] 标签）
  * 至少 1 段带歌词的推广曲
  * prompt 用英文描述音乐风格（效果更好）
  * lyrics 支持中英文，建议与书籍主题相关
- 图片/视频提示词用英文（生成效果更好），场景描述用中文
- 面向社交媒体推广投放优化（小红书、抖音、微信等）`;

  const result = await claudeChat(system, `基于以下书籍分析结果生成推广素材提示词：\n\n${JSON.stringify(keywords, null, 2)}`);
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('Failed to parse promo prompts');
}
