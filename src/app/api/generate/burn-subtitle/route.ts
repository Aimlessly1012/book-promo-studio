import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

export const maxDuration = 60;

// 调用 MiniMax 大模型分析文案情感，生成字幕样式
async function analyzeSubtitleStyleWithAI(hook: string, body: string, cta: string): Promise<ParsedStyle> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    console.warn('[burn-subtitle] No MINIMAX_API_KEY, using default style');
    return getDefaultStyle();
  }

  const prompt = `You are a video subtitle style expert. Analyze the following ad copy and recommend the best subtitle style for burning into a short video (TikTok/Reels style).

Copy to analyze:
- Hook: ${hook}
- Body: ${body}
- CTA: ${cta}

Choose the best style based on the EMOTIONAL TONE of the copy:
- "intense": for conflict, betrayal, revenge, thriller, anger - USE RED color, position TOP
- "romantic": for love, attraction, sweet moments, passion - USE PINK color, position BOTTOM  
- "mysterious": for secrets, identity reveals, suspense, unknown - USE YELLOW color, position TOP
- "general": for informational, normal ads - USE WHITE color, position BOTTOM
- "dramatic": for emotional reveals, plot twists, shocking moments - USE WHITE color, position CENTER

Respond with ONLY a JSON object, no other text:
{"position": "top|bottom|center", "fontSize": "small|medium|large", "color": "white|yellow|red|pink|cyan", "background": "none|semi-transparent-black|blur"}`;

  try {
    const res = await fetch('https://api.minimaxi.com/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    console.log('[burn-subtitle] MiniMax response:', content);

    // 解析 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parseSubtitleStyleFromAI(parsed);
    }
  } catch (err) {
    console.warn('[burn-subtitle] MiniMax API failed:', err);
  }

  return getDefaultStyle();
}

function getDefaultStyle(): ParsedStyle {
  return {
    fontSize: 24,
    marginV: 35,  // 顶部位置
    primaryColour: '&H00FFFFFF',
    backColour: '&H00000000',  // 无背景，避免遮挡
    fontName: 'DejaVu Sans Bold',
  };
}

function parseSubtitleStyleFromAI(ai: { position?: string; fontSize?: string; color?: string; background?: string }): ParsedStyle {
  // TikTok 竖屏 (9:16) 安全区域：
  // - 顶部: 5-10% (MarginV=20~35)
  // - 底部: 避开下方的 UI (MarginV=250~280)
  // - 居中: MarginV=450
  const fontSizeMap: Record<string, number> = { small: 18, medium: 24, large: 28 };
  const marginVMap: Record<string, number> = { top: 30, center: 450, bottom: 260 };
  const colorMap: Record<string, string> = {
    white: '&H00FFFFFF',
    yellow: '&H00FFFF00',
    red: '&H000000FF',
    pink: '&H00FF69B4',
    cyan: '&H0000FFFF',
  };
  const backColourMap: Record<string, string> = {
    none: '&H00000000',  // 无背景
    'semi-transparent-black': '&H80000000',
    blur: '&H00808080',
  };

  return {
    fontSize: ai.fontSize && fontSizeMap[ai.fontSize] ? fontSizeMap[ai.fontSize] : 24,
    marginV: ai.position && marginVMap[ai.position] ? marginVMap[ai.position] : 30,
    primaryColour: ai.color && colorMap[ai.color] ? colorMap[ai.color] : '&H00FFFFFF',
    backColour: ai.background && backColourMap[ai.background] ? backColourMap[ai.background] : '&H00000000',
    fontName: 'DejaVu Sans Bold',
  };
}

// 解析 AI 返回的字幕样式
interface SubtitleStyleInput {
  position?: 'top' | 'center' | 'bottom';
  fontSize?: 'small' | 'medium' | 'large';
  color?: 'white' | 'yellow' | 'red' | 'pink' | 'cyan';
  background?: 'none' | 'semi-transparent-black' | 'blur';
}

interface ParsedStyle {
  fontSize: number;
  marginV: number;
  primaryColour: string;
  backColour: string;
  fontName: string;
}

function parseSubtitleStyle(style?: SubtitleStyleInput): ParsedStyle {
  const defaults: ParsedStyle = {
    fontSize: 28,
    marginV: 80,
    primaryColour: '&H00FFFFFF',
    backColour: '&H80000000',
    fontName: 'DejaVu Sans Bold',
  };

  if (!style) return defaults;

  const fontSizeMap = { small: 20, medium: 28, large: 36 };
  const marginVMap = { top: 80, center: 450, bottom: 30 };
  const colorMap = {
    white: '&H00FFFFFF',
    yellow: '&H00FFFF00',
    red: '&H000000FF',
    pink: '&H00FF69B4',
    cyan: '&H0000FFFF',
  };
  const backColourMap = {
    none: '&H00000000',
    'semi-transparent-black': '&H80000000',
    blur: '&H80000000',  // blur 改成半透明黑色
  };

  return {
    fontSize: style.fontSize ? fontSizeMap[style.fontSize] : defaults.fontSize,
    marginV: style.position ? marginVMap[style.position] : defaults.marginV,
    primaryColour: style.color ? colorMap[style.color] : defaults.primaryColour,
    backColour: style.background ? backColourMap[style.background] : defaults.backColour,
    fontName: defaults.fontName,
  };
}

function fmtTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function generateSRT(lines: string[], durationSec: number): string {
  const perLine = durationSec / Math.max(lines.length, 1);
  let srt = '';
  lines.forEach((line, i) => {
    const start = fmtTime(i * perLine);
    const end = fmtTime(Math.min((i + 1) * perLine, durationSec));
    srt += `${i + 1}\n${start} --> ${end}\n${line.trim()}\n\n`;
  });
  return srt;
}

async function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', filePath
    ]);
    let out = '';
    proc.stdout.on('data', (d) => (out += d));
    proc.on('close', (code) => {
      if (code === 0) resolve(parseFloat(out.trim()) || 10);
      else reject(new Error('ffprobe failed'));
    });
  });
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

export async function POST(req: NextRequest) {
  const tmpDir = path.join(os.tmpdir(), `burn-${Date.now()}`);
  try {
    const { videoUrl, hook, body, cta, angleName, subtitleStyle } = await req.json();
    if (!videoUrl) {
      return NextResponse.json({ error: 'Missing videoUrl' }, { status: 400 });
    }

    // 如果没有传入 subtitleStyle，用 MiniMax AI 分析文案情感来生成样式
    const style = subtitleStyle 
      ? parseSubtitleStyle(subtitleStyle)
      : await analyzeSubtitleStyleWithAI(hook, body, cta);
    console.log('[burn-subtitle] Using style:', style);

    // 更智能地拆分字幕文字，确保每行不要太长
    const allTexts = [hook, body, cta].filter(Boolean);
    const subtitleLines: string[] = [];
    const MAX_CHARS_PER_LINE = 20;
    const MAX_LINES = 4;  // 最多4行
    
    // 把所有文字合并成一段，不分开多行
    const combinedText = allTexts.join(' ').trim();
    
    // 先把很长的文字拆成多行
    let remaining = combinedText;
    while (remaining.length > MAX_CHARS_PER_LINE && subtitleLines.length < MAX_LINES) {
      const spaceIdx = remaining.lastIndexOf(' ', MAX_CHARS_PER_LINE);
      const cutIdx = spaceIdx > 5 ? spaceIdx : MAX_CHARS_PER_LINE;
      subtitleLines.push(remaining.slice(0, cutIdx));
      remaining = remaining.slice(cutIdx + 1);
    }
    if (remaining && subtitleLines.length < MAX_LINES) {
      subtitleLines.push(remaining);
    }

    // 如果行数太多，只取前几行
    const finalLines = subtitleLines.slice(0, MAX_LINES);
    console.log('[burn-subtitle] subtitle lines:', finalLines);

    fs.mkdirSync(tmpDir, { recursive: true });
    const videoPath = path.join(tmpDir, 'input.mp4');
    const srtPath = path.join(tmpDir, 'sub.srt');
    const outputPath = path.join(tmpDir, 'output.mp4');

    console.log('[burn-subtitle] Downloading video...');
    await downloadFile(videoUrl, videoPath);

    const duration = await getVideoDuration(videoPath);
    console.log('[burn-subtitle] Video duration:', duration);

    // 根据最终行数调整字体大小
    let dynamicFontSize = style.fontSize;
    if (finalLines.length >= 4) dynamicFontSize = Math.max(16, style.fontSize - 4);
    else if (finalLines.length >= 3) dynamicFontSize = Math.max(18, style.fontSize - 2);
    
    console.log('[burn-subtitle] FontSize:', dynamicFontSize, 'Lines:', finalLines.length);

    const srt = generateSRT(finalLines, duration);
    fs.writeFileSync(srtPath, srt, 'utf-8');

    console.log('[burn-subtitle] Burning subtitles...');
    const ffStyle = `FontSize=${dynamicFontSize},PrimaryColour=${style.primaryColour},BackColour=${style.backColour},BorderStyle=3,MarginV=${style.marginV},Outline=1,Shadow=1,FontName=${style.fontName}`;
    console.log('[burn-subtitle] FFmpeg style:', ffStyle);

    await new Promise<void>((resolve, reject) => {
      const ff = spawn('ffmpeg', [
        '-i', videoPath,
        '-vf', `subtitles=${srtPath}:force_style='${ffStyle}'`,
        '-c:v', 'mpeg4', '-q:v', '4',
        '-c:a', 'copy',
        '-y', outputPath,
      ]);
      ff.stderr.on('data', (d) => console.log('[ffmpeg]', d.toString().slice(0, 200)));
      ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`FFmpeg exit ${code}`))));
    });

    const outputBuf = fs.readFileSync(outputPath);
    const base64 = outputBuf.toString('base64');

    fs.rmSync(tmpDir, { recursive: true, force: true });

    return NextResponse.json({
      videoBase64: base64,
      mimeType: 'video/mp4',
      filename: `video-${(angleName || 'output').replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`,
    });
  } catch (err) {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    console.error('[burn-subtitle] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
