import { create } from 'zustand';
import type { BookDNA, AdMaterial, Platform } from './claude';

export type TaskStatus = 'idle' | 'analyzing' | 'generating_assets' | 'done' | 'error';

// ---- 生成资产 ----
export interface ImageAsset {
  id: string;
  angleIndex: number;
  angleName: string;
  prompt: string;
  url?: string;
  status: 'pending' | 'generating' | 'done' | 'error';
  error?: string;
}

export interface VideoAsset {
  id: string;
  angleIndex: number;
  angleName: string;
  prompt: string;
  taskId?: string;
  url?: string;
  status: 'pending' | 'generating' | 'polling' | 'done' | 'error';
  error?: string;
  provider: 'zhipu' | 'minimax';
}

export interface MusicAsset {
  id: string;
  angleIndex: number;
  angleName: string;
  prompt: string;
  lyrics: string;
  audioUrl?: string;
  audioDuration?: number;
  status: 'pending' | 'generating' | 'done' | 'error';
  error?: string;
}

interface AppState {
  // 流程状态
  status: TaskStatus;
  step: number;
  error: string | null;

  // 输入
  novelText: string;
  platform: Platform;

  // 分析结果
  bookDNA: BookDNA | null;
  adMaterials: AdMaterial[] | null;

  // 生成资产
  images: ImageAsset[];
  videos: VideoAsset[];
  musics: MusicAsset[];

  // Actions
  setNovelText: (text: string) => void;
  setPlatform: (p: Platform) => void;
  setStatus: (status: TaskStatus) => void;
  setStep: (step: number) => void;
  setError: (error: string | null) => void;
  setBookDNA: (dna: BookDNA) => void;
  setAdMaterials: (mats: AdMaterial[]) => void;
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
  novelText: '',
  platform: 'TikTok' as Platform,
  bookDNA: null,
  adMaterials: null,
  images: [],
  videos: [],
  musics: [],
};

export const useStore = create<AppState>((set) => ({
  ...initialState,

  setNovelText: (text) => set({ novelText: text }),
  setPlatform: (platform) => set({ platform }),
  setStatus: (status) => set({ status }),
  setStep: (step) => set({ step }),
  setError: (error) => set({ error, status: error ? 'error' : 'idle' }),
  setBookDNA: (bookDNA) => set({ bookDNA }),
  setAdMaterials: (adMaterials) => set({ adMaterials }),
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
