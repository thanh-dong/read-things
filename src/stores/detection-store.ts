import { create } from 'zustand';

export interface DetectionLabel {
  label: string;
  confidence: number;
}

interface DetectionState {
  labels: DetectionLabel[];
  isDetecting: boolean;
  setLabels: (labels: DetectionLabel[]) => void;
  setIsDetecting: (isDetecting: boolean) => void;
  clearLabels: () => void;
}

export const useDetectionStore = create<DetectionState>()((set) => ({
  labels: [],
  isDetecting: false,
  setLabels: (labels) => set({ labels }),
  setIsDetecting: (isDetecting) => set({ isDetecting }),
  clearLabels: () => set({ labels: [] }),
}));
