// ─── Skia Camera Component ──────────────────────────────────
// Full skeleton-overlay camera using react-native-vision-camera-skia.
// Commented out for now — can be dropped into any screen that needs
// real-time pose skeleton rendering on the camera feed.
//
// Usage:
//   import { SkiaCameraView } from './Skia';
//   <SkiaCameraView
//     cameraPosition="front"
//     isActive={true}
//   />

// import { StyleSheet } from 'react-native';
// import { SkiaCamera } from 'react-native-vision-camera-skia';
// import { Skia } from '@shopify/react-native-skia';
// import {
//   nitroPoseExercises,
// } from 'react-native-nitro-pose-exercises';

// // ─── Skeleton Drawing Config ─────────────────────────────────
// const SKELETON_CONNECTIONS: [number, number][] = [
//   // Face
//   [0, 1],
//   [1, 2],
//   [2, 3],
//   [3, 7],
//   [0, 4],
//   [4, 5],
//   [5, 6],
//   [6, 8],
//   [9, 10],
//   // Torso
//   [11, 12],
//   [11, 23],
//   [12, 24],
//   [23, 24],
//   // Left arm
//   [11, 13],
//   [13, 15],
//   // Right arm
//   [12, 14],
//   [14, 16],
//   // Left leg
//   [23, 25],
//   [25, 27],
//   // Right leg
//   [24, 26],
//   [26, 28],
//   // Hands
//   [15, 17],
//   [15, 19],
//   [15, 21],
//   [16, 18],
//   [16, 20],
//   [16, 22],
//   // Feet
//   [27, 29],
//   [27, 31],
//   [28, 30],
//   [28, 32],
// ];

// const KEY_LANDMARKS = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

// interface SkiaCameraViewProps {
//   cameraPosition: 'front' | 'back';
//   isActive: boolean;
// }

// export function SkiaCameraView({ cameraPosition, isActive }: SkiaCameraViewProps) {
//   return (
//     <SkiaCamera
//       style={StyleSheet.absoluteFill}
//       isActive={isActive}
//       device={cameraPosition}
//       pixelFormat="rgb"
//       onFrame={(frame, render) => {
//         'worklet';
//         try {
//           nitroPoseExercises.processFrame(frame);
//
//           const landmarks = nitroPoseExercises.landmarks;
//
//           render(({ frameTexture, canvas }) => {
//             // Draw camera frame
//             canvas.drawImage(frameTexture, 0, 0);
//
//             // Draw skeleton overlay
//             if (landmarks && landmarks.length > 0) {
//               const w = frame.width;
//               const h = frame.height;
//
//               // Draw bones (connections)
//               const linePaint = Skia.Paint();
//               linePaint.setColor(Skia.Color('#00FF00'));
//               linePaint.setStrokeWidth(4);
//               linePaint.setStyle(1);
//
//               for (const [i, j] of SKELETON_CONNECTIONS) {
//                 if (i < landmarks.length && j < landmarks.length) {
//                   const a = landmarks[i];
//                   const b = landmarks[j];
//                   if (a && b) {
//                     if (a.visibility > 0.5 && b.visibility > 0.5) {
//                       canvas.drawLine(
//                         a.x * w,
//                         a.y * h,
//                         b.x * w,
//                         b.y * h,
//                         linePaint
//                       );
//                     }
//                   }
//                 }
//               }
//
//               // Draw joints
//               const jointPaint = Skia.Paint();
//               jointPaint.setColor(Skia.Color('#FF0000'));
//               jointPaint.setStyle(0);
//
//               const activeJointPaint = Skia.Paint();
//               activeJointPaint.setColor(Skia.Color('#00FFFF'));
//               activeJointPaint.setStyle(0);
//
//               for (let idx = 0; idx < landmarks.length; idx++) {
//                 const lm = landmarks[idx];
//                 if (lm) {
//                   if (lm.visibility > 0.5) {
//                     const isKey = KEY_LANDMARKS.includes(idx);
//                     const paint = isKey ? activeJointPaint : jointPaint;
//                     const radius = isKey ? 8 : 4;
//                     canvas.drawCircle(lm.x * w, lm.y * h, radius, paint);
//                   }
//                 }
//               }
//             }
//           });
//         } finally {
//           frame.dispose();
//         }
//       }}
//     />
//   );
// }
