import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

export const CALF_RAISE_CONFIG: ExerciseConfig = {
  name: 'Calf Raise',
  type: 'rep',
  angles: [
    { name: 'leftAnkle', landmarkA: 25, landmarkB: 27, landmarkC: 31 },
    { name: 'rightAnkle', landmarkA: 26, landmarkB: 28, landmarkC: 32 },
    { name: 'leftKnee', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
  ],
  phases: [
    { phase: 'down', angleName: 'leftAnkle', minAngle: 70, maxAngle: 95 },
    { phase: 'up', angleName: 'leftAnkle', minAngle: 110, maxAngle: 150 },
  ],
  repSequence: ['down', 'up', 'down'],
  formRules: [
    {
      name: 'kneesBending',
      message: 'Keep your legs straight',
      severity: 'warning',
      angleName: 'leftKnee',
      minAngle: 165,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 0,
};
