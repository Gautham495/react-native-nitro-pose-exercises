import type { ExerciseConfig } from '../NitroPoseExercises.nitro';
export const FRONT_RAISE_CONFIG: ExerciseConfig = {
  name: 'Front Raise',
  type: 'rep',
  angles: [
    {
      name: 'leftShoulderFlexion',
      landmarkA: 23,
      landmarkB: 11,
      landmarkC: 15,
    },
    {
      name: 'rightShoulderFlexion',
      landmarkA: 24,
      landmarkB: 12,
      landmarkC: 16,
    },
    { name: 'leftElbow', landmarkA: 11, landmarkB: 13, landmarkC: 15 },
  ],
  phases: [
    {
      phase: 'down',
      angleName: 'leftShoulderFlexion',
      minAngle: 0,
      maxAngle: 25,
    },
    {
      phase: 'up',
      angleName: 'leftShoulderFlexion',
      minAngle: 75,
      maxAngle: 110,
    },
  ],
  repSequence: ['down', 'up', 'down'],
  formRules: [
    {
      name: 'elbowBending',
      message: 'Keep your arms straight — slight bend only',
      severity: 'warning',
      angleName: 'leftElbow',
      minAngle: 155,
      maxAngle: 180,
    },
    {
      name: 'tooHigh',
      message: 'Stop at shoulder height',
      severity: 'info',
      angleName: 'leftShoulderFlexion',
      minAngle: 0,
      maxAngle: 115,
    },
  ],
  holdDurationMs: 0,
};
