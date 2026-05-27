import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

// MediaPipe Pose Landmark indices
// 11 = left shoulder, 12 = right shoulder
// 23 = left hip, 24 = right hip
// 25 = left knee, 26 = right knee

export const SITUP_CONFIG: ExerciseConfig = {
  name: 'Sit-Up',
  type: 'rep',
  angles: [
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
      phase: 'down',
      angleName: 'leftHip',
      minAngle: 130,
      maxAngle: 180,
    },
    {
      phase: 'up',
      angleName: 'leftHip',
      minAngle: 40,
      maxAngle: 90,
    },
  ],
  repSequence: ['down', 'up', 'down'],
  formRules: [
    {
      name: 'neckStrain',
      message: "Don't pull on your neck — lead with your chest",
      severity: 'warning',
      angleName: 'leftHip',
      minAngle: 30,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 0,
};
