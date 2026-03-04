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

  const res = await fetch('https://api.minimaxi.com/v1/text/chatcompletion_v2', {
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

// ---- 新增类型定义 ----
export type Platform = 'facebook' | 'google' | 'tiktok';
export type LLMProvider = 'claude' | 'minimax';

export type CopyType =
  | '长-pov剧情'
  | '长-普通剧情'
  | '长-口播剧情'
  | '长-对话流'
  | '长-分镜脚本'
  | '长-种草推书'
  | '短-评论弹幕'
  | '短-单句爆点'
  | '短-模拟信息';

export type MaterialType = '轮播视频' | '轮播图片' | '解压' | '滚屏漫画';

// ---- 渠道规则 ----
const PLATFORM_RULES: Record<Platform, string> = {
  facebook: `Target Platform: Facebook Ads
- Audience: Social feed users, broad age range, emotion-driven
- Tone: Warm, relatable, storytelling style
- Language: English
- Hook style: Start with emotional empathy or dramatic conflict`,

  google: `Target Platform: Google Ads (Display/Discovery)
- Audience: Active searchers with reading intent
- Tone: Clear, benefit-focused, persuasive
- Language: English
- Hook style: Value proposition first, clear CTA`,

  tiktok: `Target Platform: TikTok Ads
- Audience: Gen Z / Millennial, entertainment-first
- Tone: Bold, punchy, exaggerated emotion
- Language: English (casual, trend-aware)
- Hook style: Instant shock or curiosity gap in first 3 words`,
};

// ---- 文案类型规则 ----
const COPY_TYPE_RULES: Record<CopyType, string> = {
  '长-pov剧情': `Copywriting format: Long POV Drama
- Write in first-person POV (I/me)
- 3-5 progressive paragraphs, each ≤50 words
- Build tension each paragraph, end on a cliffhanger
- Reader should feel "this is happening to me"`,

  '长-普通剧情': `Copywriting format: Long Narrative Drama
- Third-person narrator style
- Setup conflict → escalate → reveal twist
- 3-4 paragraphs, cinematic pacing`,

  '长-口播剧情': `Copywriting format: Long Voiceover Script
- Optimized for spoken delivery
- Short punchy sentences, use rhetorical questions
- Include natural breathing pauses marked as [pause]
- Emotionally charged language throughout`,

  '长-对话流': `Copywriting format: Long Dialogue Flow
- Written as character dialogue (2-3 back-and-forth exchanges)
- Format: "Character A: ..." / "Character B: ..."
- Show conflict, secret reveal, or confrontation through dialogue`,

  '长-分镜脚本': `Copywriting format: Long Storyboard Script
- Numbered shots, e.g. [Shot 1], [Shot 2]
- Each shot includes: Scene description | On-screen text | Duration (seconds)
- Minimum 4 shots, designed for vertical 9:16 video`,

  '长-种草推书': `Copywriting format: Long Book Recommendation
- Blogger/influencer voice, personal enthusiasm
- Highlight the book title prominently
- Share 2-3 emotional moments from the story
- End with "Read more →" style hook`,

  '短-评论弹幕': `Copywriting format: Short Comments & Bullet Chat
- 3-5 simulated hot comments or danmaku (bullet chat)
- Include emoji and platform slang
- Mimic real reader reactions (surprise, obsession, shock)`,

  '短-单句爆点': `Copywriting format: Short Single Explosive Line
- 1-2 sentences maximum, ≤20 words
- Maximum emotional impact — make the reader gasp or crave more
- No explanation, pure hook`,

  '短-模拟信息': `Copywriting format: Short Simulated Message
- Simulate chat messages / SMS / notification text
- Format like a real messaging app screenshot text
- 2-3 short message bubbles showing a dramatic exchange`,
};

// ---- 素材类型规则 ----
const MATERIAL_TYPE_RULES: Record<MaterialType, string> = {
  '轮播视频': `Material type: Carousel Video
- image_prompt: Describe 3-4 sequential frames for a carousel (frame 1, frame 2...)
- video_prompt: Multi-clip edit with transitions, each clip 3-5s, total 15-30s, vertical 9:16`,

  '轮播图片': `Material type: Carousel Images
- image_prompt: Generate 3-4 distinct static images with unified visual style, each tells one story beat
- video_prompt: N/A — generate empty string for video_prompt`,

  '解压': `Material type: ASMR / Stress-Relief Content
- image_prompt: Tactile, visually satisfying scene — rich textures, saturated colors, detail-focused close-up
- video_prompt: Slow motion, close-up macro shots, looping feel, soothing color grade, no fast cuts`,

  '滚屏漫画': `Material type: Vertical Scroll Comic (Webtoon style)
- image_prompt: Vertical 9:16 comic panels, stacked layout, each panel depicts one scene beat, consistent art style
- video_prompt: Canvas scroll animation, panels reveal top-to-bottom, gentle scroll speed, hold on key panels`,
};

// ---- 动态构建 System Prompt ----
interface PromptParams {
  platform: Platform;
  copyType: CopyType;
  materialType: MaterialType;
  angleCount: number;
}

function buildSystemPrompt({ platform, copyType, materialType, angleCount }: PromptParams): string {
  return `You are a world-class webnovel overseas marketing expert and multi-modal AI prompt engineer.

${PLATFORM_RULES[platform]}

${COPY_TYPE_RULES[copyType]}

${MATERIAL_TYPE_RULES[materialType]}

---

When given a novel text, analyze it and produce ${angleCount} differentiated ad material packages.

## Step 1 — Extract Book DNA
Identify:
- primary_tropes (2–3 tags): e.g. 霸总虐恋 / 带球跑 / 逆袭打脸 / 隐藏首富 / 系统流
- visual_aesthetic: overall visual tone, e.g. Dark luxury / Sweet romance / Imperial grandeur
- emotional_trigger: the single strongest emotional hook that will make users click

## Step 2 — Design ${angleCount} Distinct Ad Angles
You MUST create EXACTLY ${angleCount} angles. Each angle must target a different emotional entry point.
Example (adjust count to match ${angleCount}):
- Angle 1: Betrayal & revenge
- Angle 2: Secret identity reveal
- Angle 3: Forbidden attraction
${angleCount > 3 ? `- Angle 4: Unexpected power-up / reversal
- ... continue until you have exactly ${angleCount} angles` : ''}

## Step 3 — Generate Full Material Package Per Angle
Apply the platform rules, copywriting format, and material type rules above for each angle.

**CRITICAL — Visual-Copy Binding Rule:**
The image_prompt and video_prompt MUST be a direct visual translation of THIS angle's copywriting.
Before writing image_prompt or video_prompt, extract from your copywriting:
1. The KEY SCENE: what specific moment / location / action does the hook or body describe?
2. The PROTAGONIST: who is in the scene, what are they doing, what emotion are they showing?
3. The CONFLICT CORE: what tension or dramatic turning point defines this angle?
Then build the visual prompts around these three extracted elements — NOT generic book cover aesthetics.

For each angle produce:

### copywriting
- hook: instant emotional impact, first 3 seconds of the ad (follow the copywriting format rules above)
- body: main copy body (follow the copywriting format rules above)
- cta: 1 clear action line, e.g. "Read the full story →"

### voiceover_prompt
- voice_profile: gender, age range, emotional tone, pacing
- script_with_pauses: full script with [pause] markers, directly based on the copywriting body

### image_prompt (ENGLISH ONLY)
**Derive from this angle's copywriting scene.** Follow the material type image rules above.
Structure as comma-separated tags that capture the specific dramatic moment described in the copy:
[protagonist + their exact emotion from copy], [the action/pose in the key scene], [clothing fitting the story setting],
[specific location/background from the copy's scene], [lighting matching the emotional tone], [camera angle],
[art style + quality tags]
Do NOT write generic romantic poses — the scene must match what the copy describes.

### video_prompt (ENGLISH ONLY)
**Visually narrate the same emotional arc as the copywriting.** Follow the material type video rules above.
Describe: opening shot (matches hook scene) → mid sequence (matches body conflict) → closing beat (matches CTA tension).
Include: camera motion, scene transitions, pacing, color grade, aspect ratio.

### bgm_prompt (ENGLISH ONLY)
Music style, instrumentation, emotional arc matching the copy's tone, tempo, vocal elements.

### bgm_lyrics
Provide lyrics for the BGM track. Support structure tags [Intro][Verse][Chorus][Bridge][Outro].
For instrumental only, use: [Intro]\\n[instrumental]\\n[Outro]
For tracks with vocals, write lyrics matching the book's theme, 10-600 characters.
At least 1 of the 3 angles should have instrumental BGM, and at least 1 should have vocal lyrics.

At least 1 of the 3 angles should have instrumental BGM, and at least 1 should have vocal lyrics.

### subtitle_style (REQUIRED)
Based on the emotional tone of this angle, choose ONE subtitle style template from below:

**Template A - "intense"** (for conflict, betrayal, revenge, thriller):
- position: "top", fontSize: "large", color: "red", background: "semi-transparent-black"

**Template B - "romantic"** (for love, attraction, sweet moments):
- position: "bottom", fontSize: "medium", color: "pink", background: "semi-transparent-black"

**Template C - "mysterious"** (for secrets, identity reveals, suspense):
- position: "top", fontSize: "large", color: "yellow", background: "blur"

**Template D - "general"** (for normal ads, informational):
- position: "bottom", fontSize: "medium", color: "white", background: "semi-transparent-black"

**Template E - "dramatic"** (for emotional reveals, plot twists):
- position: "center", fontSize: "large", color: "white", background: "blur"

Select the template that best matches this angle's emotional tone. Output as:
- For Template A: "subtitle_style": { "position": "top", "fontSize": "large", "color": "red", "background": "semi-transparent-black" }
- For Template B: "subtitle_style": { "position": "bottom", "fontSize": "medium", "color": "pink", "background": "semi-transparent-black" }
- For Template C: "subtitle_style": { "position": "top", "fontSize": "large", "color": "yellow", "background": "blur" }
- For Template D: "subtitle_style": { "position": "bottom", "fontSize": "medium", "color": "white", "background": "semi-transparent-black" }
- For Template E: "subtitle_style": { "position": "center", "fontSize": "large", "color": "white", "background": "blur" }

## Language Rules
- copywriting & voiceover script: English (follow platform rules above)
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
      "bgm_lyrics": "string",
      "subtitle_style": {
        "position": "top" | "center" | "bottom",
        "fontSize": "small" | "medium" | "large",
        "color": "white" | "yellow" | "red" | "pink" | "cyan",
        "background": "none" | "semi-transparent-black" | "blur"
      }
    }
  ]
}

ad_materials MUST have EXACTLY ${angleCount} items — no more, no fewer.`;
}

// ---- 类型定义 ----
export interface BookDNA {
  primary_tropes: string[];
  visual_aesthetic: string;
  emotional_trigger: string;
}

export interface SubtitleStyle {
  position: 'top' | 'center' | 'bottom';
  fontSize: 'small' | 'medium' | 'large';
  color: 'white' | 'yellow' | 'red' | 'pink' | 'cyan';
  background: 'none' | 'semi-transparent-black' | 'blur';
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
  subtitle_style?: SubtitleStyle;
}

export interface SkillOutput {
  book_dna: BookDNA;
  ad_materials: AdMaterial[];
}

// ---- 一步生成：分析小说 + 生成全部素材提示词 ----
export async function generateAdMaterials(
  novelText: string,
  platform: Platform = 'tiktok',
  llmProvider: LLMProvider = 'minimax',
  copyType: CopyType = '长-pov剧情',
  materialType: MaterialType = '轮播视频',
  angleCount: number = 3
): Promise<SkillOutput> {
  const systemPrompt = buildSystemPrompt({ platform, copyType, materialType, angleCount });
  const userMessage = `Target platform: ${platform}\nCopy type: ${copyType}\nMaterial type: ${materialType}\nAd angles: ${angleCount}\n\nNovel text:\n${novelText}`;

  const result = llmProvider === 'minimax'
    ? await minimaxChat(systemPrompt, userMessage)
    : await claudeChat(systemPrompt, userMessage);

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
      // 修复 LLM 常见的非法转义字符（如 \' \- \. \! 等）
      const repaired = jsonMatch[0].replace(/\\(?!["\\\/bfnrtu])/g, '\\\\');
      return JSON.parse(repaired) as SkillOutput;
    } catch (e) {
      console.error('[generateAdMaterials] JSON.parse failed:', e);
      console.error('[generateAdMaterials] matched string preview:', jsonMatch[0].slice(0, 500));
      throw new Error(`JSON parse error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  console.error('[generateAdMaterials] no JSON object found. Full result:', result);
  throw new Error('Failed to parse ad materials JSON — no JSON object found in response');
}
