import type { Frame } from 'react-native-vision-camera';
import type { DetectionLabel } from '@/stores/detection-store';

// The labelImage function is registered by the native ML Kit plugin
// and is available in frame processor worklets
declare global {
  function labelImage(frame: Frame): DetectionLabel[] | null;
}

export type { DetectionLabel };
