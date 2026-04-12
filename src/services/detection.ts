import type { DetectionLabel } from '@/stores/detection-store';

// The labelImage function is registered by the native ML Kit plugin
// and is available in frame processor worklets
declare global {
  function labelImage(frame: unknown): DetectionLabel[] | null;
}

export type { DetectionLabel };
