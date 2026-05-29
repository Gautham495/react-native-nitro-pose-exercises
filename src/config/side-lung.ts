import type { ExerciseConfig } from '../NitroPoseExercises.nitro';
export const SIDE_LUNGE_CONFIG: ExerciseConfig = {
  name: 'Side Lunge',
  type: 'rep',
  angles: [
    { name: 'bentKnee', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
    { name: 'straightLeg', landmarkA: 24, landmarkB: 26, landmarkC: 28 },
    { name: 'torso', landmarkA: 11, landmarkB: 23, landmarkC: 25 },
  ],
  phases: [
    { phase: 'up', angleName: 'bentKnee', minAngle: 155, maxAngle: 180 },
    { phase: 'down', angleName: 'bentKnee', minAngle: 70, maxAngle: 110 },
  ],
  repSequence: ['up', 'down', 'up'],
  formRules: [
    {
      name: 'straightLegBending',
      message: 'Keep your other leg straight',
      severity: 'warning',
      angleName: 'straightLeg',
      minAngle: 160,
      maxAngle: 180,
    },
    {
      name: 'leaningForward',
      message: 'Keep your chest up',
      severity: 'warning',
      angleName: 'torso',
      minAngle: 70,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 0,
};
