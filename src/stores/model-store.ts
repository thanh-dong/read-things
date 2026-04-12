import { create } from 'zustand';

export type ModelStatus =
  | 'not-downloaded'
  | 'downloading'
  | 'downloaded'
  | 'loading'
  | 'ready'
  | 'error';

interface ModelState {
  status: ModelStatus;
  downloadProgress: number;
  error: string | null;
  setStatus: (status: ModelStatus) => void;
  setDownloadProgress: (progress: number) => void;
  setError: (error: string | null) => void;
}

export const useModelStore = create<ModelState>()((set) => ({
  status: 'not-downloaded',
  downloadProgress: 0,
  error: null,
  setStatus: (status) =>
    set((state) => ({
      status,
      error: status === 'error' ? state.error : null,
    })),
  setDownloadProgress: (downloadProgress) => set({ downloadProgress }),
  setError: (error) => set({ error, status: 'error' }),
}));
