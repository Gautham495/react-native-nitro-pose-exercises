import { StyleSheet } from 'react-native';
import {
  Camera,
  useFrameOutput,
  useAsyncRunner,
  type CameraDevice,
} from 'react-native-vision-camera';
import { nitroPoseExercises } from 'react-native-nitro-pose-exercises';

// ─── Normal Camera Component ────────────────────────────────
// Standard VisionCamera with async frame processing for pose detection.
// No skeleton overlay — just processes frames and sends to the pose engine.

interface NormalCameraViewProps {
  device: CameraDevice;
  isActive: boolean;
}

export function NormalCameraView({ device, isActive }: NormalCameraViewProps) {
  const asyncRunner = useAsyncRunner();

  // ─── Frame Processor ────────────────────────────────────────
  const frameOutput = useFrameOutput({
    pixelFormat: 'rgb',
    onFrame(frame) {
      'worklet';
      const accepted = asyncRunner.runAsync(() => {
        'worklet';
        try {
          nitroPoseExercises.processFrame(frame);
        } finally {
          frame.dispose();
        }
      });
      if (!accepted) frame.dispose();
    },
  });

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={isActive}
      outputs={[frameOutput]}
    />
  );
}
