import type { ExerciseConfig } from '../NitroPoseExercises.nitro';
export const LEG_RAISE_CONFIG: ExerciseConfig = {
  name: 'Leg Raise',
  type: 'rep',
  angles: [
    { name: 'leftHip', landmarkA: 11, landmarkB: 23, landmarkC: 27 },
    { name: 'leftKnee', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
  ],
  phases: [
    { phase: 'down', angleName: 'leftHip', minAngle: 150, maxAngle: 180 },
    { phase: 'up', angleName: 'leftHip', minAngle: 60, maxAngle: 110 },
  ],
  repSequence: ['down', 'up', 'down'],
  formRules: [
    {
      name: 'kneesBending',
      message: 'Keep your legs straight',
      severity: 'warning',
      angleName: 'leftKnee',
      minAngle: 160,
      maxAngle: 180,
    },
    {
      name: 'lowerBackLifting',
      message: 'Press your lower back into the floor',
      severity: 'warning',
      angleName: 'leftHip',
      minAngle: 50,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 0,
};
