import { useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import {
  Camera,
  useFrameOutput,
  useAsyncRunner,
  type CameraDevice,
} from 'react-native-vision-camera';
import {
  createResizer,
  // isResizerAvailable,
  type Resizer,
} from 'react-native-vision-camera-resizer';

import { nitroPoseExercises } from 'react-native-nitro-pose-exercises';

interface NormalCameraViewProps {
  device: CameraDevice;
  isActive: boolean;
}

const TARGET_W = 256;
const TARGET_H = 256;

export function NormalCameraView({ device, isActive }: NormalCameraViewProps) {
  const asyncRunner = useAsyncRunner();
  const [resizer, setResizer] = useState<Resizer | null>(null);

  // Android only: build the resizer once. RGBA / uint8 / interleaved → matches IMAGE_FORMAT_RGBA_8888 on ML Kit.

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    // if (!isResizerAvailable()) {
    //   console.warn('[PoseExercise] GPU resizer unavailable on this device');
    //   return;
    // }
    let created: Resizer | null = null;
    createResizer({
      width: TARGET_W,
      height: TARGET_H,
      channelOrder: 'rgb',
      dataType: 'uint8',
      pixelLayout: 'interleaved',
      scaleMode: 'cover',
    })
      .then((r) => {
        created = r;
        setResizer(r);
      })
      .catch((e) => console.error('[PoseExercise] createResizer failed:', e));
    return () => {
      created?.dispose();
      setResizer(null);
    };
  }, []);

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
            if (resizer != null) {
              const resized = resizer.resize(frame);
              const buffer = resized.getPixelBuffer();

              const rotation =
                frame.orientation === 'right'
                  ? 90
                  : frame.orientation === 'down'
                    ? 180
                    : frame.orientation === 'left'
                      ? 270
                      : 0;

              nitroPoseExercises.processFrameAndroid(
                buffer,
                TARGET_W,
                TARGET_H,
                rotation
              );
              resized.dispose();
            }
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
