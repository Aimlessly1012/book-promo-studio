/**
 * LLM 封装层 — 支持 Claude 和 MiniMax
 * 使用 @anthropic-ai/sdk (Claude) 和原生 fetch (MiniMax)
 */

import Anthropic from '@anthropic-ai/sdk';

// ---- Claude ----
function getClaudeClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  return new Anthropic({ apiKey });
}

export async function claudeChat(systemPrompt: string, userMessage: string, model = 'claude-sonnet-4-5-20250929') {
  const client = getClaudeClient();
  const message = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const block = message.content[0];
  if (block.type === 'text') return block.text;
  return '';
}

// ---- MiniMax ----
export async function minimaxChat(systemPrompt: string, userMessage: string, model = 'MiniMax-Text-01') {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw new Error('MINIMAX_API_KEY not set');

  const res = await fetch('https://api.minimaxi.chat/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MiniMax API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  console.log('[minimaxChat] response status:', res.status);
  console.log('[minimaxChat] response data:', JSON.stringify(data).slice(0, 500));

  // MiniMax 用 HTTP 200 + base_resp.status_code 表示业务错误
  if (data.base_resp?.status_code !== 0) {
    throw new Error(`MiniMax error ${data.base_resp?.status_code}: ${data.base_resp?.status_msg}`);
  }

  const choice = data.choices?.[0];
  const content = choice?.message?.content;

  // MiniMax 有时返回字符串，有时返回 content 数组
  if (Array.isArray(content)) {
    return content.map((c: { text?: string }) => c.text ?? '').join('');
  }
  return (content as string) ?? '';
}

// ---- Skill System Prompt ----
const AD_GENERATOR_SYSTEM_PROMPT = `You are a world-class webnovel overseas marketing expert and multi-modal AI prompt engineer.

When given a novel text, analyze it and produce 3 differentiated ad material packages.

## Step 1 — Extract Book DNA
Identify:
- primary_tropes (2–3 tags): e.g. 霸总虐恋 / 带球跑 / 逆袭打脸 / 隐藏首富 / 系统流
- visual_aesthetic: overall visual tone, e.g. Dark luxury / Sweet romance / Imperial grandeur
- emotional_trigger: the single strongest emotional hook that will make users click

## Step 2 — Design 3 Distinct Ad Angles
Each angle must target a different emotional entry point:
- e.g. Angle 1: Betrayal & revenge | Angle 2: Secret identity reveal | Angle 3: Forbidden attraction

## Step 3 — Generate Full Material Package Per Angle
For each angle produce:

### copywriting
- hook: ≤15 words, instant emotional impact, first 3 seconds of the ad
- body: 2–4 sentences, tease conflict without resolving, end on cliffhanger
- cta: 1 clear action line, e.g. "Read the full story on NovelAgo →"

### voiceover_prompt
- voice_profile: gender, age range, emotional tone, pacing
- script_with_pauses: full script with [pause] markers

### image_prompt (ENGLISH ONLY)
Comma-separated tags:
[subject + expression], [action/pose], [clothing], [scene/background], [lighting], [camera angle], [art style + quality]

### video_prompt (ENGLISH ONLY)
Camera motion, scene transitions, pacing, color grade, aspect ratio.

### bgm_prompt (ENGLISH ONLY)
Music style, instrumentation, emotional arc, tempo, vocal elements.

### bgm_lyrics
Provide lyrics for the BGM track. Support structure tags [Intro][Verse][Chorus][Bridge][Outro].
For instrumental only, use: [Intro]\\n[instrumental]\\n[Outro]
For tracks with vocals, write lyrics matching the book's theme, 10-600 characters.
At least 1 of the 3 angles should have instrumental BGM, and at least 1 should have vocal lyrics.

## Language Rules
- copywriting & voiceover script: match target platform (TikTok/Meta/YouTube Shorts → English)
- image_prompt / video_prompt / bgm_prompt: ALWAYS English, zero Chinese characters

## Output
Return a SINGLE pure JSON object. No markdown code fences, no text before or after JSON.

Schema:
{
  "book_dna": {
    "primary_tropes": ["string"],
    "visual_aesthetic": "string",
    "emotional_trigger": "string"
  },
  "ad_materials": [
    {
      "angle_name": "string",
      "copywriting": { "hook": "string", "body": "string", "cta": "string" },
      "voiceover_prompt": { "voice_profile": "string", "script_with_pauses": "string" },
      "image_prompt": "string",
      "video_prompt": "string",
      "bgm_prompt": "string",
      "bgm_lyrics": "string"
    }
  ]
}

ad_materials must have exactly 3 items.`;

// ---- 类型定义 ----
export interface BookDNA {
  primary_tropes: string[];
  visual_aesthetic: string;
  emotional_trigger: string;
}

export interface AdMaterial {
  angle_name: string;
  copywriting: {
    hook: string;
    body: string;
    cta: string;
  };
  voiceover_prompt: {
    voice_profile: string;
    script_with_pauses: string;
  };
  image_prompt: string;
  video_prompt: string;
  bgm_prompt: string;
  bgm_lyrics: string;
}

export interface SkillOutput {
  book_dna: BookDNA;
  ad_materials: AdMaterial[];
}

// ---- 一步生成：分析小说 + 生成全部素材提示词 ----
export type Platform = 'TikTok' | 'Meta' | 'YouTube Shorts';
export type LLMProvider = 'claude' | 'minimax';

export async function generateAdMaterials(
  novelText: string,
  platform: Platform = 'TikTok',
  llmProvider: LLMProvider = 'minimax'
): Promise<SkillOutput> {
  const userMessage = `Target platform: ${platform}\n\nNovel text:\n${novelText}`;

  const result = llmProvider === 'minimax'
    ? await minimaxChat(AD_GENERATOR_SYSTEM_PROMPT, userMessage)
    : await claudeChat(AD_GENERATOR_SYSTEM_PROMPT, userMessage);

  // 提取 JSON — 兼容各种模型的输出格式
  console.log('[generateAdMaterials] raw result length:', result.length);
  console.log('[generateAdMaterials] raw result preview:', result.slice(0, 300));

  // 去掉 markdown 代码块（可能在首尾或中间）
  const cleaned = result
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]) as SkillOutput;
    } catch (e) {
      console.error('[generateAdMaterials] JSON.parse failed:', e);
      console.error('[generateAdMaterials] matched string preview:', jsonMatch[0].slice(0, 500));
      throw new Error(`JSON parse error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  console.error('[generateAdMaterials] no JSON object found. Full result:', result);
  throw new Error('Failed to parse ad materials JSON — no JSON object found in response');
}
