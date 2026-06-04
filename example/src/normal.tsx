import { Platform, StyleSheet } from 'react-native';
import {
  Camera,
  useFrameOutput,
  useAsyncRunner,
  type CameraDevice,
} from 'react-native-vision-camera';

import { nitroPoseExercises } from 'react-native-nitro-pose-exercises';

interface NormalCameraViewProps {
  device: CameraDevice;
  isActive: boolean;
}

export function NormalCameraView({ device, isActive }: NormalCameraViewProps) {
  const asyncRunner = useAsyncRunner();

  const frameOutput = useFrameOutput({
    pixelFormat: 'yuv',
    onFrame(frame) {
      'worklet';
      const accepted = asyncRunner.runAsync(() => {
        'worklet';
        try {
          if (Platform.OS === 'ios') {
            nitroPoseExercises.processFrameIOS(frame);
          } else {
            nitroPoseExercises.processFrameAndroid(frame);
          }
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
