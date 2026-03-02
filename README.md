# 📚 Book Promo Studio — 书籍推广素材一站式生成

输入书籍内容 → AI 自动提取关键词 → 生成图片/视频/音频提示词 → 批量调用多模型生成素材

## 🔧 技术栈

| 环节 | 模型 | 能力 |
|------|------|------|
| 文本分析 & 提示词生成 | **Claude** (Anthropic) | 关键词提取、卖点分析、提示词工程 |
| 图片生成 | **CogView-4** (智谱) | 中文理解优秀的文生图 |
| 视频生成 | **CogVideoX** (智谱) + **Hailuo Video-01** (MiniMax) | 双引擎，交替使用 |
| 语音合成 | **Speech-02-HD** (MiniMax) | 高质量中文 TTS |

## 🚀 快速开始

```bash
cd book-promo-studio
cp .env.example .env.local
# 编辑 .env.local 填入 API Key
npm install
npm run dev
```

打开 http://localhost:3001

## 📋 工作流程

1. **输入内容** — 粘贴书籍文本/简介/目录/章节
2. **AI 分析** — Claude 提取关键词、卖点、金句、目标人群
3. **提示词生成** — Claude 根据分析结果生成图/视频/音频的 AI 提示词
4. **批量生成** — 一键调用智谱/MiniMax API 批量生成素材
5. **预览下载** — 在线预览图片/播放视频/试听音频

## 📁 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/       # Claude 文本分析 + 提示词生成
│   │   ├── generate/
│   │   │   ├── image/     # CogView-4 图片生成
│   │   │   ├── video/     # CogVideoX/Hailuo 视频生成
│   │   │   └── audio/     # MiniMax TTS 语音合成
│   │   └── tasks/         # 异步任务状态轮询
│   ├── components/        # UI 组件
│   └── page.tsx           # 主页面
└── lib/
    ├── claude.ts          # Anthropic API 封装
    ├── zhipu.ts           # 智谱 API 封装
    ├── minimax.ts         # MiniMax API 封装
    └── store.ts           # Zustand 状态管理
```

## 🔑 需要的 API Key

- **Anthropic** — https://console.anthropic.com
- **智谱 AI** — https://open.bigmodel.cn
- **MiniMax** — https://platform.minimaxi.com
