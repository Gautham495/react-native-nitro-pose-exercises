import type { ExerciseConfig } from '../NitroPoseExercises.nitro';
export const OVERARM_REACH_CONFIG: ExerciseConfig = {
  name: 'Overarm Reach',
  type: 'rep',
  angles: [
    {
      name: 'leftShoulderAbduction',
      landmarkA: 23,
      landmarkB: 11,
      landmarkC: 15,
    },
    {
      name: 'rightShoulderAbduction',
      landmarkA: 24,
      landmarkB: 12,
      landmarkC: 16,
    },
    { name: 'leftElbow', landmarkA: 11, landmarkB: 13, landmarkC: 15 },
  ],
  phases: [
    {
      phase: 'down',
      angleName: 'leftShoulderAbduction',
      minAngle: 0,
      maxAngle: 30,
    },
    {
      phase: 'up',
      angleName: 'leftShoulderAbduction',
      minAngle: 155,
      maxAngle: 180,
    },
  ],
  repSequence: ['down', 'up', 'down'],
  formRules: [
    {
      name: 'elbowsBending',
      message: 'Keep your arms straight',
      severity: 'warning',
      angleName: 'leftElbow',
      minAngle: 160,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 0,
};
