import type { ExerciseConfig } from '../NitroPoseExercises.nitro';
export const REVERSE_WARRIOR_CONFIG: ExerciseConfig = {
  name: 'Reverse Warrior (Viparita Virabhadrasana)',
  type: 'hold',
  angles: [
    { name: 'frontKnee', landmarkA: 23, landmarkB: 25, landmarkC: 27 },
    { name: 'backLeg', landmarkA: 24, landmarkB: 26, landmarkC: 28 },
    { name: 'torsoArch', landmarkA: 11, landmarkB: 23, landmarkC: 25 },
  ],
  phases: [
    { phase: 'hold', angleName: 'frontKnee', minAngle: 80, maxAngle: 110 },
  ],
  repSequence: [],
  formRules: [
    {
      name: 'frontKneeStraight',
      message: 'Bend your front knee deeper',
      severity: 'warning',
      angleName: 'frontKnee',
      minAngle: 80,
      maxAngle: 110,
    },
    {
      name: 'backLegBent',
      message: 'Keep your back leg strong and straight',
      severity: 'warning',
      angleName: 'backLeg',
      minAngle: 160,
      maxAngle: 180,
    },
  ],
  holdDurationMs: 30000,
};
