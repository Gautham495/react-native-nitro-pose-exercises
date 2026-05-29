import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

export const SIDE_PLANK_CONFIG: ExerciseConfig = {
  name: 'Side Plank',
  type: 'hold',
  angles: [
    { name: 'hipLateral', landmarkA: 11, landmarkB: 23, landmarkC: 27 },
    { name: 'supportArm', landmarkA: 11, landmarkB: 13, landmarkC: 15 },
  ],
  phases: [
    { phase: 'hold', angleName: 'hipLateral', minAngle: 155, maxAngle: 180 },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'hipDrop',
      message: 'Lift your hips — keep your body in a straight line',
      severity: 'warning',
      angleName: 'hipLateral',
      minAngle: 155,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 30000,
};
