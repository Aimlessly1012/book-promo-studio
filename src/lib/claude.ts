/**
 * Claude API 封装 — 网文广告素材生成
 * 基于 webnovel_ad_generator skill 的 System Prompt
 * 使用 @anthropic-ai/sdk 官方 SDK
 */

import Anthropic from '@anthropic-ai/sdk';

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  return new Anthropic({ apiKey });
}

export async function claudeChat(systemPrompt: string, userMessage: string, model = 'claude-sonnet-4-20250514') {
  const client = getClient();
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

export async function generateAdMaterials(
  novelText: string,
  platform: Platform = 'TikTok'
): Promise<SkillOutput> {
  const result = await claudeChat(
    AD_GENERATOR_SYSTEM_PROMPT,
    `Target platform: ${platform}\n\nNovel text:\n${novelText}`
  );

  // 提取 JSON
  const cleaned = result.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]) as SkillOutput;
  }
  throw new Error('Failed to parse ad materials JSON');
}
