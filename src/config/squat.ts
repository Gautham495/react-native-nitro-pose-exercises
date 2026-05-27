import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

// MediaPipe Pose Landmark indices
// 23 = left hip, 25 = left knee, 27 = left ankle
// 24 = right hip, 26 = right knee, 28 = right ankle
// 11 = left shoulder, 12 = right shoulder

export const SQUAT_CONFIG: ExerciseConfig = {
  name: 'Squat',
  type: 'rep',
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
    {
      name: 'rightHip',
      landmarkA: 12, // right shoulder
      landmarkB: 24, // right hip (vertex)
      landmarkC: 26, // right knee
    },
  ],
  phases: [
    {
      phase: 'up',
      angleName: 'leftKnee',
      minAngle: 155,
      maxAngle: 180,
    },
    {
      phase: 'down',
      angleName: 'leftKnee',
      minAngle: 50,
      maxAngle: 105,
    },
  ],
  repSequence: ['up', 'down', 'up'],
  formRules: [
    {
      name: 'kneesCaving',
      message: 'Push your knees out over your toes',
      severity: 'warning',
      angleName: 'leftKnee',
      minAngle: 40,
      maxAngle: 180,
    },
    {
      name: 'leaningForward',
      message: "Keep your torso upright — don't lean too far forward",
      severity: 'warning',
      angleName: 'leftHip',
      minAngle: 70,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 0,
};
