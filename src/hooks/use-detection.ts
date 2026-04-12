import { useCallback, useMemo } from 'react';
import {
  useFrameProcessor,
  runAtTargetFps,
  VisionCameraProxy,
} from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
import { useDetectionStore } from '@/stores/detection-store';

const labelPlugin = VisionCameraProxy.initFrameProcessorPlugin('labelImage', {});

export function useDetection() {
  const setLabels = useDetectionStore((s) => s.setLabels);

  const jsCallback = useCallback(
    (labels: Array<{ label: string; confidence: number }>) => {
      setLabels(labels);
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
