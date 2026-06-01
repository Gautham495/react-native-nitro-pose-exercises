import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Camera,
  useFrameOutput,
  useAsyncRunner,
  type CameraDevice,
} from 'react-native-vision-camera';
import { Canvas, Picture, Skia } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { nitroPoseExercises } from 'react-native-nitro-pose-exercises';

interface NormalCameraViewProps {
  device: CameraDevice;
  isActive: boolean;
  cameraPosition?: 'front' | 'back';
}

/* ─── Skeleton Topology (MediaPipe indices) ───────────────────── */
const SKELETON_CONNECTIONS: [number, number][] = [
  // Torso
  [11, 12],
  [11, 23],
  [12, 24],
  [23, 24],
  // Left arm
  [11, 13],
  [13, 15],
  // Right arm
  [12, 14],
  [14, 16],
  // Left leg
  [23, 25],
  [25, 27],
  // Right leg
  [24, 26],
  [26, 28],
  // Hands
  [15, 17],
  [15, 19],
  [15, 21],
  [16, 18],
  [16, 20],
  [16, 22],
  // Feet
  [27, 29],
  [27, 31],
  [28, 30],
  [28, 32],
];

const KEY_LANDMARKS = new Set([11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]);

const VIS_THRESHOLD = 0.1;

export function NormalCameraView({
  device,
  isActive,
  cameraPosition = 'front',
}: NormalCameraViewProps) {
  const asyncRunner = useAsyncRunner();

  const landmarksShared = useSharedValue<any[] | null>(null);
  const canvasSize = useSharedValue({ width: 0, height: 0 });
  const frameSize = useSharedValue({ width: 0, height: 0 });
  const isInValidPosture = useSharedValue(true);

  /* ─── Frame Processor ──────────────────────────────────────── */
  const frameOutput = useFrameOutput({
    pixelFormat: 'yuv',
    onFrame(frame) {
      'worklet';
      frameSize.value = { width: frame.width, height: frame.height };

      const accepted = asyncRunner.runAsync(() => {
        'worklet';
        try {
          nitroPoseExercises.processFrame(frame);
          isInValidPosture.value = nitroPoseExercises.isReady();
          const lms = nitroPoseExercises.landmarks;

          if (!lms || lms.length === 0) {
            landmarksShared.value = null;
          } else {
            // Confidence-weighted smoothing — low-confidence joints lean
            // on previous position to avoid whipping during occlusion.
            const prev = landmarksShared.value;
            const next = lms.map((lm: any, i: number) => {
              const p = prev?.[i];
              if (!p) return lm;
              const alpha = Math.max(0.2, Math.min(0.7, lm.visibility));
              return {
                x: p.x + (lm.x - p.x) * alpha,
                y: p.y + (lm.y - p.y) * alpha,
                z: 0,
                visibility: Math.max(lm.visibility, p.visibility * 0.9),
              };
            });
            landmarksShared.value = next;
          }
        } catch {
          // Swallow — never crash the worklet runtime.
        } finally {
          frame.dispose();
        }
      });
      if (!accepted) frame.dispose();
    },
  });

  /* ─── Paints (built once on JS thread) ─────────────────────── */
  const paints = useMemo(() => {
    const make = (color: string, style: 0 | 1, strokeWidth?: number) => {
      const p = Skia.Paint();
      p.setColor(Skia.Color(color));
      p.setStyle(style);
      if (strokeWidth) p.setStrokeWidth(strokeWidth);
      p.setAntiAlias(true);
      return p;
    };
    return {
      // Green = ready
      boneGreen: make('#00FF00', 1, 4),
      jointGreen: make('#00FF00', 0),
      jointGreenGlow: make('#00FF0055', 0),
      keyGreen: make('#00FFFF', 0),
      keyGreenGlow: make('#00FFFF66', 0),
      // Orange = out of position
      boneOrange: make('#FF9800', 1, 4),
      jointOrange: make('#FF9800', 0),
      jointOrangeGlow: make('#FF980055', 0),
      keyOrange: make('#FFB74D', 0),
      keyOrangeGlow: make('#FFB74D66', 0),
    };
  }, []);

  const recorder = useMemo(() => Skia.PictureRecorder(), []);

  /* ─── Skeleton Picture ─────────────────────────────────────── */
  const picture = useDerivedValue(() => {
    'worklet';
    const size = canvasSize.value;
    const fSize = frameSize.value;
    const lms = landmarksShared.value;

    const valid = isInValidPosture.value;

    const palette = valid
      ? {
          bone: paints.boneGreen,
          joint: paints.jointGreen,
          jointGlow: paints.jointGreenGlow,
          jointKey: paints.keyGreen,
          jointKeyGlow: paints.keyGreenGlow,
        }
      : {
          bone: paints.boneOrange,
          joint: paints.jointOrange,
          jointGlow: paints.jointOrangeGlow,
          jointKey: paints.keyOrange,
          jointKeyGlow: paints.keyOrangeGlow,
        };

    const sw = size?.width ?? 0;
    const sh = size?.height ?? 0;
    const fw = fSize?.width ?? 0;

    const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, sw, sh));

    if (!lms || lms.length === 0 || sw === 0 || fw === 0) {
      return recorder.finishRecordingAsPicture();
    }

    // Front cam preview is mirrored — flip x to match
    const toScreen = (lx: number, ly: number) => ({
      x: cameraPosition === 'front' ? (1 - lx) * sw : lx * sw,
      y: ly * sh,
    });

    /* Layer 1: bones */
    const bonePath = Skia.Path.Make();
    let bonePathHasContent = false;

    for (let i = 0; i < SKELETON_CONNECTIONS.length; i++) {
      const [a, b] = SKELETON_CONNECTIONS[i] as [number, number];
      if (a >= lms.length || b >= lms.length) continue;
      const pa = lms[a];
      const pb = lms[b];
      if (!pa || !pb) continue;
      if (pa.visibility < VIS_THRESHOLD || pb.visibility < VIS_THRESHOLD)
        continue;

      const ptA = toScreen(pa.x, pa.y);
      const ptB = toScreen(pb.x, pb.y);

      if (
        !isFinite(ptA.x) ||
        !isFinite(ptA.y) ||
        !isFinite(ptB.x) ||
        !isFinite(ptB.y)
      )
        continue;

      bonePath.moveTo(ptA.x, ptA.y);
      bonePath.lineTo(ptB.x, ptB.y);
      bonePathHasContent = true;
    }

    if (bonePathHasContent) {
      canvas.drawPath(bonePath, palette.bone);
    }

    /* Layer 2: joints — glow halo + solid dot. Skip face (0-10). */
    for (let idx = 11; idx < lms.length; idx++) {
      const lm = lms[idx];
      if (!lm) continue;
      if (lm.visibility < VIS_THRESHOLD) continue;

      const pt = toScreen(lm.x, lm.y);
      if (!isFinite(pt.x) || !isFinite(pt.y)) continue;

      const isKey = KEY_LANDMARKS.has(idx);
      const r = isKey ? 8 : 6;
      const glowR = r * 2.1;

      canvas.drawCircle(
        pt.x,
        pt.y,
        glowR,
        isKey ? palette.jointKeyGlow : palette.jointGlow
      );
      canvas.drawCircle(
        pt.x,
        pt.y,
        r,
        isKey ? palette.jointKey : palette.joint
      );
    }

    return recorder.finishRecordingAsPicture();
  });

  return (
    <View style={{ flex: 1 }}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        outputs={[frameOutput]}
      />
      <Canvas
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        onSize={canvasSize}
      >
        <Picture picture={picture} />
      </Canvas>
    </View>
  );
}
