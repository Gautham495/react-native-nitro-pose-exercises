import type { ExerciseConfig } from '../NitroPoseExercises.nitro';
export const COBRA_WINGS_CONFIG: ExerciseConfig = {
  name: 'Cobra Wings',
  type: 'rep',
  angles: [
    { name: 'hipExtension', landmarkA: 11, landmarkB: 23, landmarkC: 25 },
    { name: 'leftShoulder', landmarkA: 23, landmarkB: 11, landmarkC: 13 },
    { name: 'leftElbow', landmarkA: 11, landmarkB: 13, landmarkC: 15 },
  ],
  phases: [
    { phase: 'down', angleName: 'hipExtension', minAngle: 160, maxAngle: 180 },
    { phase: 'up', angleName: 'hipExtension', minAngle: 120, maxAngle: 155 },
  ],
  repSequence: ['down', 'up', 'down'],
  formRules: [
    {
      name: 'legsLifting',
      message: 'Keep your legs on the ground',
      severity: 'warning',
      angleName: 'hipExtension',
      minAngle: 110,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 0,
};
