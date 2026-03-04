import { create } from 'zustand';
import type { BookDNA, AdMaterial, Platform, LLMProvider, CopyType, MaterialType } from './claude';

export type TaskStatus = 'idle' | 'analyzing' | 'generating_assets' | 'done' | 'error';
export type GenerationMode = 'image' | 'copy' | 'video' | null;

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
  sourceImageUrl?: string; // 图生视频时的源图片
  status: 'pending' | 'generating' | 'polling' | 'burning' | 'done' | 'error';
  error?: string;
  provider: 'zhipu' | 'minimax' | 'doubao';
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

  // 输入 & 配置
  novelText: string;
  platform: Platform;
  llmProvider: LLMProvider;
  copyType: CopyType;
  materialType: MaterialType;
  angleCount: number;
  generationMode: GenerationMode;

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
  setLLMProvider: (p: LLMProvider) => void;
  setCopyType: (c: CopyType) => void;
  setMaterialType: (m: MaterialType) => void;
  setAngleCount: (n: number) => void;
  setGenerationMode: (m: GenerationMode) => void;
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
  platform: 'tiktok' as Platform,
  llmProvider: 'minimax' as LLMProvider,
  copyType: '长-pov剧情' as CopyType,
  materialType: '轮播视频' as MaterialType,
  angleCount: 3,
  generationMode: null as GenerationMode,
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
  setLLMProvider: (llmProvider) => set({ llmProvider }),
  setCopyType: (copyType) => set({ copyType }),
  setMaterialType: (materialType) => set({ materialType }),
  setAngleCount: (angleCount) => set({ angleCount }),
  setGenerationMode: (generationMode) => set({ generationMode }),
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
