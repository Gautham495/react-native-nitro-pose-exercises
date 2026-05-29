import type { ExerciseConfig } from '../NitroPoseExercises.nitro';

export const LATERAL_RAISE_CONFIG: ExerciseConfig = {
  name: 'Lateral Raise',
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
      minAngle: 5,
      maxAngle: 30,
    },
    {
      phase: 'up',
      angleName: 'leftShoulderAbduction',
      minAngle: 75,
      maxAngle: 110,
    },
  ],
  repSequence: ['down', 'up', 'down'],
  formRules: [
    {
      name: 'elbowBending',
      message: "Keep a slight bend — don't fully bend your elbows",
      severity: 'warning',
      angleName: 'leftElbow',
      minAngle: 150,
      maxAngle: 180,
    },
    {
      name: 'raisingTooHigh',
      message: "Stop at shoulder height — don't go above",
      severity: 'info',
      angleName: 'leftShoulderAbduction',
      minAngle: 5,
      maxAngle: 115,
    },
  ],
  holdDurationMs: 0,
};
