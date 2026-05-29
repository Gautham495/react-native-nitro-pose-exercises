import type { ExerciseConfig } from '../NitroPoseExercises.nitro';
export const V_UP_CONFIG: ExerciseConfig = {
  name: 'V-Up',
  type: 'rep',
  angles: [
    { name: 'hipFold', landmarkA: 15, landmarkB: 23, landmarkC: 27 },
    { name: 'leftKnee', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
  ],
  phases: [
    { phase: 'down', angleName: 'hipFold', minAngle: 150, maxAngle: 180 },
    { phase: 'up', angleName: 'hipFold', minAngle: 30, maxAngle: 80 },
  ],
  repSequence: ['down', 'up', 'down'],
  formRules: [
    {
      name: 'kneesBending',
      message: 'Keep your legs straight — reach for your toes',
      severity: 'warning',
      angleName: 'leftKnee',
      minAngle: 155,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 0,
};
