import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

export const PULL_UP_CONFIG: ExerciseConfig = {
  name: 'Pull-Up',
  type: 'rep',
  angles: [
    { name: 'leftElbow', landmarkA: 11, landmarkB: 13, landmarkC: 15 },
    { name: 'rightElbow', landmarkA: 12, landmarkB: 14, landmarkC: 16 },
    { name: 'leftShoulder', landmarkA: 23, landmarkB: 11, landmarkC: 13 },
  ],
  phases: [
    { phase: 'down', angleName: 'leftElbow', minAngle: 150, maxAngle: 180 },
    { phase: 'up', angleName: 'leftElbow', minAngle: 40, maxAngle: 90 },
  ],
  repSequence: ['down', 'up', 'down'],
  formRules: [
    {
      name: 'kipping',
      message: 'Control the movement — no swinging',
      severity: 'warning',
      angleName: 'leftShoulder',
      minAngle: 0,
      maxAngle: 160,
    },
  ],
  holdDurationMs: 0,
};
