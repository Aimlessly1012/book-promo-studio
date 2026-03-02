import { create } from 'zustand';

export type TaskStatus = 'idle' | 'analyzing' | 'generating_prompts' | 'generating_assets' | 'done' | 'error';

export interface KeywordData {
  title: string;
  coreTheme: string;
  keywords: { word: string; emotion: string; weight: number }[];
  sellingPoints: string[];
  targetAudience: string[];
  emotionalHooks: string[];
  goldenQuotes: string[];
}

export interface ImageAsset {
  id: string;
  scene: string;
  prompt: string;
  style: string;
  url?: string;
  status: 'pending' | 'generating' | 'done' | 'error';
  error?: string;
}

export interface VideoAsset {
  id: string;
  scene: string;
  prompt: string;
  duration: string;
  taskId?: string;
  url?: string;
  status: 'pending' | 'generating' | 'polling' | 'done' | 'error';
  error?: string;
  provider: 'zhipu' | 'minimax';
}

export interface AudioAsset {
  id: string;
  type: string;
  text: string;
  voice: string;
  emotion: string;
  audioUrl?: string;
  status: 'pending' | 'generating' | 'done' | 'error';
  error?: string;
}

export interface PromoPrompts {
  imagePrompts: { scene: string; prompt: string; style: string }[];
  videoPrompts: { scene: string; prompt: string; duration: string }[];
  audioPrompts: { type: string; text: string; voice: string; emotion: string }[];
}

interface AppState {
  // 流程状态
  status: TaskStatus;
  step: number;
  error: string | null;

  // 输入
  bookContent: string;

  // 分析结果
  keywords: KeywordData | null;
  prompts: PromoPrompts | null;

  // 生成资产
  images: ImageAsset[];
  videos: VideoAsset[];
  audios: AudioAsset[];

  // Actions
  setBookContent: (content: string) => void;
  setStatus: (status: TaskStatus) => void;
  setStep: (step: number) => void;
  setError: (error: string | null) => void;
  setKeywords: (kw: KeywordData) => void;
  setPrompts: (prompts: PromoPrompts) => void;
  setImages: (images: ImageAsset[]) => void;
  setVideos: (videos: VideoAsset[]) => void;
  setAudios: (audios: AudioAsset[]) => void;
  updateImage: (id: string, patch: Partial<ImageAsset>) => void;
  updateVideo: (id: string, patch: Partial<VideoAsset>) => void;
  updateAudio: (id: string, patch: Partial<AudioAsset>) => void;
  reset: () => void;
}

const initialState = {
  status: 'idle' as TaskStatus,
  step: 0,
  error: null,
  bookContent: '',
  keywords: null,
  prompts: null,
  images: [],
  videos: [],
  audios: [],
};

export const useStore = create<AppState>((set) => ({
  ...initialState,

  setBookContent: (content) => set({ bookContent: content }),
  setStatus: (status) => set({ status }),
  setStep: (step) => set({ step }),
  setError: (error) => set({ error, status: error ? 'error' : 'idle' }),
  setKeywords: (keywords) => set({ keywords }),
  setPrompts: (prompts) => set({ prompts }),
  setImages: (images) => set({ images }),
  setVideos: (videos) => set({ videos }),
  setAudios: (audios) => set({ audios }),

  updateImage: (id, patch) =>
    set((s) => ({ images: s.images.map((img) => (img.id === id ? { ...img, ...patch } : img)) })),
  updateVideo: (id, patch) =>
    set((s) => ({ videos: s.videos.map((v) => (v.id === id ? { ...v, ...patch } : v)) })),
  updateAudio: (id, patch) =>
    set((s) => ({ audios: s.audios.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),

  reset: () => set(initialState),
}));
