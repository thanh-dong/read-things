import { useCallback, useMemo, useRef } from 'react';
import {
  useFrameProcessor,
  runAtTargetFps,
  VisionCameraProxy,
} from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
import { useDetectionStore } from '@/stores/detection-store';
import type { DetectionLabel } from '@/stores/detection-store';

const labelPlugin = VisionCameraProxy.initFrameProcessorPlugin('labelImage', {});

const WINDOW_SIZE = 6; // ~3 seconds at 2fps
const TOP_LABELS = 5;

export function useDetection() {
  const setLabels = useDetectionStore((s) => s.setLabels);
  const frameHistory = useRef<DetectionLabel[][]>([]);

  const jsCallback = useCallback(
    (labels: DetectionLabel[]) => {
      const history = frameHistory.current;

      // Add new frame's labels to history
      history.push(labels);

      // Trim to sliding window
      if (history.length > WINDOW_SIZE) {
        history.shift();
      }

      // Aggregate: count frequency and track max confidence per label
      const labelMap = new Map<string, { count: number; maxConfidence: number }>();
      for (const frame of history) {
        for (const item of frame) {
          const existing = labelMap.get(item.label);
          if (existing) {
            existing.count++;
            existing.maxConfidence = Math.max(existing.maxConfidence, item.confidence);
          } else {
            labelMap.set(item.label, { count: 1, maxConfidence: item.confidence });
          }
        }
      }

      // Sort by (frequency * confidence) descending, take top N
      const aggregated: DetectionLabel[] = Array.from(labelMap.entries())
        .map(([label, { count, maxConfidence }]) => ({
          label,
          confidence: maxConfidence,
          score: (count / history.length) * maxConfidence,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, TOP_LABELS)
        .map(({ label, confidence }) => ({ label, confidence }));

      setLabels(aggregated);
    },
    [setLabels],
  );

  const onLabelsDetected = useMemo(
    () => Worklets.createRunOnJS(jsCallback),
    [jsCallback],
  );

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      runAtTargetFps(2, () => {
        'worklet';
        const result = labelPlugin?.call(frame) as
          | Array<{ label: string; confidence: number }>
          | undefined;
        if (result && result.length > 0) {
          onLabelsDetected(result);
        }
      });
    },
    [onLabelsDetected],
  );

  return { frameProcessor };
}
