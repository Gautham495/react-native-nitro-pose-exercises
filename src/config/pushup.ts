import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

// MediaPipe Pose Landmark indices
// 11 = left shoulder, 13 = left elbow, 15 = left wrist
// 12 = right shoulder, 14 = right elbow, 16 = right wrist
// 23 = left hip, 25 = left knee, 27 = left ankle
// 24 = right hip, 26 = right knee, 28 = right ankle

export const PUSHUP_CONFIG: ExerciseConfig = {
  name: 'Push-Up',
  type: 'rep',
  postureFamily: 'horizontalProne',
  visibilityThreshold: 0.1,
  cameraAngle: 'front',
  angles: [
    { name: 'leftElbow', landmarkA: 11, landmarkB: 13, landmarkC: 15 },
    { name: 'rightElbow', landmarkA: 12, landmarkB: 14, landmarkC: 16 },
  ],
  phases: [
    { phase: 'up', angleName: 'leftElbow', minAngle: 130, maxAngle: 180 },
    { phase: 'down', angleName: 'leftElbow', minAngle: 0, maxAngle: 120 },
  ],
  repSequence: ['up', 'down', 'up'],
  formRules: [],
  holdDurationMs: 0,
};
