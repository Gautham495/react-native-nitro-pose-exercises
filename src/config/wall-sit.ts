import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

// MediaPipe Pose Landmark indices
// 23 = left hip, 25 = left knee, 27 = left ankle
// 24 = right hip, 26 = right knee, 28 = right ankle
// 11 = left shoulder, 12 = right shoulder

export const WALL_SIT_CONFIG: ExerciseConfig = {
  name: 'Wall Sit',
  type: 'hold',
  angles: [
    {
      name: 'leftKnee',
      landmarkA: 23, // left hip
      landmarkB: 25, // left knee (vertex)
      landmarkC: 27, // left ankle
    },
    {
      name: 'rightKnee',
      landmarkA: 24, // right hip
      landmarkB: 26, // right knee (vertex)
      landmarkC: 28, // right ankle
    },
    {
      name: 'leftHip',
      landmarkA: 11, // left shoulder
      landmarkB: 23, // left hip (vertex)
      landmarkC: 25, // left knee
    },
  ],
  phases: [
    {
      phase: 'hold',
      angleName: 'leftKnee',
      minAngle: 80,
      maxAngle: 110,
    },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'tooHigh',
      message: 'Sit lower — your thighs should be parallel to the ground',
      severity: 'warning',
      angleName: 'leftKnee',
      minAngle: 80,
      maxAngle: 110,
    },
    {
      name: 'leaningForward',
      message: 'Press your back flat against the wall',
      severity: 'warning',
      angleName: 'leftHip',
      minAngle: 80,
      maxAngle: 110,
    },
  ],
  holdDurationMs: 45000, // 45 seconds default
};
