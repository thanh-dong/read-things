import { useCallback, useMemo } from 'react';
import { useFrameProcessor, runAtTargetFps } from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
import { useDetectionStore } from '@/stores/detection-store';
import '@/services/detection';

export function useDetection() {
  const setLabels = useDetectionStore((s) => s.setLabels);

  const jsCallback = useCallback((labels: Array<{ label: string; confidence: number }>) => {
    setLabels(labels);
  }, [setLabels]);

  const onLabelsDetected = useMemo(
    () => Worklets.createRunOnJS(jsCallback),
    [jsCallback]
  );

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    runAtTargetFps(2, () => {
      'worklet';
      const result = labelImage(frame);
      if (result && result.length > 0) {
        onLabelsDetected(result);
      }
    });
  }, [onLabelsDetected]);

  return { frameProcessor };
}
