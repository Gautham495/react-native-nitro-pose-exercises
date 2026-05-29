import type { ExerciseConfig } from '../NitroPoseExercises.nitro';
export const KNEE_RAISE_CONFIG: ExerciseConfig = {
  name: 'Knee Raise',
  type: 'rep',
  angles: [
    { name: 'leftHip', landmarkA: 11, landmarkB: 23, landmarkC: 25 },
    { name: 'rightHip', landmarkA: 12, landmarkB: 24, landmarkC: 26 },
    { name: 'torso', landmarkA: 11, landmarkB: 23, landmarkC: 27 },
  ],
  phases: [
    { phase: 'down', angleName: 'leftHip', minAngle: 155, maxAngle: 180 },
    { phase: 'up', angleName: 'leftHip', minAngle: 60, maxAngle: 110 },
  ],
  repSequence: ['down', 'up', 'down'],
  formRules: [
    {
      name: 'leaningBack',
      message: "Stay upright — don't lean back",
      severity: 'warning',
      angleName: 'torso',
      minAngle: 160,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 0,
};
