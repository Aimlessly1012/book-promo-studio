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

export interface MusicAsset {
  id: string;
  scene: string;
  prompt: string;
  lyrics: string;
  mood: string;
  audioUrl?: string;
  audioDuration?: number;  // ms
  status: 'pending' | 'generating' | 'done' | 'error';
  error?: string;
}

export interface PromoPrompts {
  imagePrompts: { scene: string; prompt: string; style: string }[];
  videoPrompts: { scene: string; prompt: string; duration: string }[];
  musicPrompts: { scene: string; prompt: string; lyrics: string; mood: string }[];
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
  musics: MusicAsset[];

  // Actions
  setBookContent: (content: string) => void;
  setStatus: (status: TaskStatus) => void;
  setStep: (step: number) => void;
  setError: (error: string | null) => void;
  setKeywords: (kw: KeywordData) => void;
  setPrompts: (prompts: PromoPrompts) => void;
  setImages: (images: ImageAsset[]) => void;
  setVideos: (videos: VideoAsset[]) => void;
  setMusics: (musics: MusicAsset[]) => void;
  updateImage: (id: string, patch: Partial<ImageAsset>) => void;
  updateVideo: (id: string, patch: Partial<VideoAsset>) => void;
  updateMusic: (id: string, patch: Partial<MusicAsset>) => void;
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
  musics: [],
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
  setMusics: (musics) => set({ musics }),

  updateImage: (id, patch) =>
    set((s) => ({ images: s.images.map((img) => (img.id === id ? { ...img, ...patch } : img)) })),
  updateVideo: (id, patch) =>
    set((s) => ({ videos: s.videos.map((v) => (v.id === id ? { ...v, ...patch } : v)) })),
  updateMusic: (id, patch) =>
    set((s) => ({ musics: s.musics.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),

  reset: () => set(initialState),
}));
